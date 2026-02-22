import { execSync } from 'node:child_process';

function getJsFiles() {
    const stdout = execSync('rg --files static/js', { encoding: 'utf8' });
    return stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.endsWith('.js'));
}

function run() {
    const files = getJsFiles();
    for (const file of files) {
        execSync(`node --check "${file}"`, { stdio: 'inherit' });
    }
    console.log(`Syntax check passed: ${files.length} files`);
}

run();
