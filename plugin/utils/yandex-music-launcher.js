const { execSync, spawn } = require('child_process');
const { log } = require('./plugin');
const path = require('path');
const os = require('os');

class YandexMusicLauncher {
    constructor() {
        this.platform = os.platform();
        this.debugPort = 9222; // Будет обновляться из настроек
    }

    setDebugPort(port) {
        this.debugPort = port;
    }

    /**
     * Находит путь к исполняемому файлу Яндекс Музыки
     */
    async findYandexMusicPath() {
        try {
            if (this.platform === 'win32') {
                // Windows пути
                const possiblePaths = [
                    path.join(process.env.LOCALAPPDATA, 'Programs', 'YandexMusic', 'Яндекс Музыка.exe'),
                    path.join(process.env.APPDATA, '..', 'Local', 'Programs', 'YandexMusic', 'Яндекс Музыка.exe'),
                    path.join(process.env.PROGRAMFILES, 'YandexMusic', 'Яндекс Музыка.exe'),
                    path.join(process.env['PROGRAMFILES(X86)'], 'YandexMusic', 'Яндекс Музыка.exe'),
                ];

                // Проверяем через реестр
                try {
                    const regPath = execSync(
                        `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "Яндекс Музыка" 2>nul | findstr /i "DisplayName"`,
                        { encoding: 'utf-8', timeout: 5000 }
                    );
                    // Если нашли в реестре, можно попробовать найти путь через InstallLocation
                } catch (e) {
                    // Игнорируем ошибки реестра
                }

                // Проверяем возможные пути
                for (const possiblePath of possiblePaths) {
                    try {
                        const fs = require('fs');
                        if (fs.existsSync(possiblePath)) {
                            log.info('Найден путь к Яндекс Музыке:', possiblePath);
                            return possiblePath;
                        }
                    } catch (e) {
                        // Продолжаем поиск
                    }
                }

                // Пробуем найти через where (если в PATH)
                try {
                    const whereResult = execSync('where "Яндекс Музыка.exe" 2>nul', { encoding: 'utf-8', timeout: 3000 });
                    if (whereResult && whereResult.trim()) {
                        const foundPath = whereResult.trim().split('\n')[0];
                        log.info('Найден путь к Яндекс Музыке через where:', foundPath);
                        return foundPath;
                    }
                } catch (e) {
                    // Игнорируем
                }

            } else if (this.platform === 'darwin') {
                // macOS пути
                const possiblePaths = [
                    '/Applications/Яндекс Музыка.app',
                    path.join(process.env.HOME, 'Applications', 'Яндекс Музыка.app'),
                ];

                for (const possiblePath of possiblePaths) {
                    try {
                        const fs = require('fs');
                        if (fs.existsSync(possiblePath)) {
                            log.info('Найден путь к Яндекс Музыке:', possiblePath);
                            return possiblePath;
                        }
                    } catch (e) {
                        // Продолжаем поиск
                    }
                }

                // Пробуем найти через mdfind
                try {
                    const mdfindResult = execSync(
                        `mdfind "kMDItemKind == 'Application' && kMDItemDisplayName == 'Яндекс Музыка'" 2>/dev/null | head -1`,
                        { encoding: 'utf-8', timeout: 5000, shell: '/bin/bash' }
                    );
                    if (mdfindResult && mdfindResult.trim()) {
                        const foundPath = mdfindResult.trim();
                        log.info('Найден путь к Яндекс Музыке через mdfind:', foundPath);
                        return foundPath;
                    }
                } catch (e) {
                    // Игнорируем
                }
            }

            log.warn('Не удалось найти путь к Яндекс Музыке автоматически');
            return null;
        } catch (error) {
            log.error('Ошибка при поиске пути к Яндекс Музыке:', error);
            return null;
        }
    }

    /**
     * Проверяет, запущен ли процесс Яндекс Музыки
     */
    async isYandexMusicRunning() {
        try {
            if (this.platform === 'win32') {
                // Windows: проверяем через tasklist
                try {
                    const result = execSync(
                        'tasklist /FI "IMAGENAME eq Яндекс Музыка.exe" /FO CSV /NH 2>nul',
                        { encoding: 'utf-8', timeout: 3000 }
                    );
                    return result && result.trim().length > 0 && result.includes('Яндекс Музыка.exe');
                } catch (e) {
                    return false;
                }
            } else if (this.platform === 'darwin') {
                // macOS: проверяем через ps
                try {
                    const result = execSync(
                        `ps aux | grep -i "Яндекс Музыка" | grep -v grep | grep -v "yandex-music-launcher"`,
                        { encoding: 'utf-8', timeout: 3000, shell: '/bin/bash' }
                    );
                    return result && result.trim().length > 0;
                } catch (e) {
                    return false;
                }
            }
            return false;
        } catch (error) {
            log.error('Ошибка при проверке запущенного процесса:', error);
            return false;
        }
    }

    /**
     * Проверяет, запущен ли процесс с нужным параметром отладки
     */
    async isRunningWithDebugPort() {
        try {
            if (this.platform === 'win32') {
                // Windows: проверяем через PowerShell (более надежно)
                try {
                    // Используем Get-CimInstance вместо устаревшего Get-WmiObject
                    const psCommand = `Get-CimInstance Win32_Process -Filter "name='Яндекс Музыка.exe'" | Select-Object -ExpandProperty CommandLine`;
                    const result = execSync(
                        `powershell -NoProfile -Command "${psCommand}"`,
                        { encoding: 'utf-8', timeout: 5000 }
                    );
                    
                    if (result && result.trim()) {
                        const commandLine = result.trim();
                        log.info('Командная строка процесса:', commandLine);
                        
                        if (commandLine.includes(`--remote-debugging-port=${this.debugPort}`)) {
                            log.info('✅ Процесс запущен с правильным портом отладки');
                            return true;
                        } else {
                            log.warn('⚠️ Процесс запущен, но без нужного параметра отладки');
                            log.warn('Найденные параметры:', commandLine);
                        }
                    }
                } catch (psError) {
                    log.warn('Не удалось проверить параметры через PowerShell:', psError.message);
                    
                    // Fallback: пробуем wmic
                    try {
                        const result = execSync(
                            `wmic process where "name='Яндекс Музыка.exe'" get CommandLine /format:list 2>nul`,
                            { encoding: 'utf-8', timeout: 5000 }
                        );
                        
                        if (result && result.includes(`--remote-debugging-port=${this.debugPort}`)) {
                            return true;
                        }
                    } catch (wmicError) {
                        log.warn('Не удалось проверить через wmic:', wmicError.message);
                    }
                }
            } else if (this.platform === 'darwin') {
                // macOS: проверяем через ps
                try {
                    const result = execSync(
                        `ps aux | grep -i "Яндекс Музыка" | grep -v grep | grep -v "yandex-music-launcher"`,
                        { encoding: 'utf-8', timeout: 3000, shell: '/bin/bash' }
                    );
                    if (result && result.includes(`--remote-debugging-port=${this.debugPort}`)) {
                        return true;
                    }
                } catch (e) {
                    // Игнорируем
                }
            }
            return false;
        } catch (error) {
            log.error('Ошибка при проверке параметров запуска:', error);
            return false;
        }
    }

    /**
     * Завершает процесс Яндекс Музыки
     */
    async killYandexMusic() {
        try {
            if (this.platform === 'win32') {
                // Windows: завершаем через taskkill
                try {
                    execSync(
                        `taskkill /IM "Яндекс Музыка.exe" /F /T 2>nul`,
                        { timeout: 5000 }
                    );
                    log.info('Процесс Яндекс Музыки завершен');
                    // Даем время на завершение
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return true;
                } catch (e) {
                    log.warn('Не удалось завершить процесс (возможно, он уже не запущен):', e.message);
                    return false;
                }
            } else if (this.platform === 'darwin') {
                // macOS: завершаем через killall
                try {
                    execSync(
                        `killall "Яндекс Музыка" 2>/dev/null || true`,
                        { timeout: 5000, shell: '/bin/bash' }
                    );
                    log.info('Процесс Яндекс Музыки завершен');
                    // Даем время на завершение
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return true;
                } catch (e) {
                    log.warn('Не удалось завершить процесс (возможно, он уже не запущен):', e.message);
                    return false;
                }
            }
            return false;
        } catch (error) {
            log.error('Ошибка при завершении процесса:', error);
            return false;
        }
    }

    /**
     * Запускает Яндекс Музыку с параметром отладки
     */
    async launchYandexMusic(appPath) {
        try {
            if (!appPath) {
                appPath = await this.findYandexMusicPath();
                if (!appPath) {
                    log.error('Не удалось найти путь к Яндекс Музыке');
                    return false;
                }
            }

            if (this.platform === 'win32') {
                // Windows: запускаем через PowerShell для более надежной передачи параметров
                try {
                    // Экранируем путь для PowerShell
                    const escapedPath = appPath.replace(/\\/g, '\\\\').replace(/'/g, "''");
                    const command = `Start-Process -FilePath '${escapedPath}' -ArgumentList '--remote-debugging-port=${this.debugPort}' -WindowStyle Normal`;
                    
                    log.info('Запуск Яндекс Музыки через PowerShell');
                    log.info('Путь:', appPath);
                    log.info('Параметры: --remote-debugging-port=' + this.debugPort);
                    
                    execSync(
                        `powershell -NoProfile -Command "${command}"`,
                        { timeout: 10000, encoding: 'utf-8' }
                    );
                    
                    log.info('Яндекс Музыка запущена');
                    // Даем время на запуск
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Проверяем, что запустилось с правильными параметрами
                    const isRunning = await this.isRunningWithDebugPort();
                    if (isRunning) {
                        log.info('✅ Яндекс Музыка запущена с правильными параметрами');
                        return true;
                    } else {
                        log.warn('⚠️ Яндекс Музыка запущена, но параметры могут быть неверными');
                        // Все равно возвращаем true, так как процесс запущен
                        return true;
                    }
                } catch (error) {
                    log.error('Ошибка при запуске Яндекс Музыки через PowerShell:', error);
                    
                    // Fallback: пробуем через spawn
                    try {
                        log.info('Пробуем запустить через spawn...');
                        const child = spawn(appPath, [`--remote-debugging-port=${this.debugPort}`], {
                            detached: true,
                            stdio: 'ignore'
                        });
                        child.unref();
                        
                        log.info('Яндекс Музыка запущена через spawn');
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        return true;
                    } catch (spawnError) {
                        log.error('Ошибка при запуске через spawn:', spawnError);
                        return false;
                    }
                }
            } else if (this.platform === 'darwin') {
                // macOS: запускаем через open
                try {
                    const command = `open -a "${appPath}" --args --remote-debugging-port=${this.debugPort}`;
                    log.info('Запуск Яндекс Музыки с командой:', command);
                    
                    execSync(command, { timeout: 10000, shell: '/bin/bash' });
                    log.info('Яндекс Музыка запущена');
                    // Даем время на запуск
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return true;
                } catch (error) {
                    log.error('Ошибка при запуске Яндекс Музыки:', error);
                    return false;
                }
            }
            return false;
        } catch (error) {
            log.error('Ошибка при запуске Яндекс Музыки:', error);
            return false;
        }
    }

    /**
     * Проверяет и запускает Яндекс Музыку с нужными параметрами
     * Возвращает true если все в порядке, false если не удалось
     */
    async ensureYandexMusicRunning() {
        try {
            log.info('Проверка состояния Яндекс Музыки...');
            log.info('Ожидаемый порт отладки:', this.debugPort);
            
            const isRunning = await this.isYandexMusicRunning();
            log.info('Яндекс Музыка запущена:', isRunning);
            
            if (isRunning) {
                const hasDebugPort = await this.isRunningWithDebugPort();
                log.info('Запущена с нужным портом отладки:', hasDebugPort);
                
                if (hasDebugPort) {
                    log.info('✅ Яндекс Музыка запущена с правильными параметрами');
                    // Даем время на инициализацию CDP
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return true;
                } else {
                    log.info('⚠️ Яндекс Музыка запущена, но без нужного параметра. Перезапускаем...');
                    const killed = await this.killYandexMusic();
                    if (killed) {
                        // Даем время на полное завершение процесса
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            
            // Запускаем или перезапускаем
            log.info('Запуск Яндекс Музыки с параметром отладки...');
            const launched = await this.launchYandexMusic();
            
            if (launched) {
                log.info('✅ Яндекс Музыка успешно запущена');
                
                // Дополнительная проверка после запуска
                await new Promise(resolve => setTimeout(resolve, 2000));
                const hasDebugPort = await this.isRunningWithDebugPort();
                
                if (hasDebugPort) {
                    log.info('✅ Подтверждено: Яндекс Музыка запущена с правильными параметрами');
                } else {
                    log.warn('⚠️ Предупреждение: не удалось подтвердить параметры запуска, но процесс запущен');
                }
                
                // Даем дополнительное время на инициализацию CDP
                await new Promise(resolve => setTimeout(resolve, 2000));
                return true;
            } else {
                log.error('❌ Не удалось запустить Яндекс Музыку');
                return false;
            }
        } catch (error) {
            log.error('Ошибка при проверке/запуске Яндекс Музыки:', error);
            return false;
        }
    }
}

const launcher = new YandexMusicLauncher();
module.exports = launcher;

