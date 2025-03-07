from pathlib import Path
from os.path import join
from shutil import copy, rmtree
from subprocess import run
from time import sleep


EXCLUSIONS = [
    'database.sqlite',
    'favicons/README.md',
    'files/',
    'logs/',
    'main.log',
    'resources/key.bin',
    'web/',
]


def main():
    rmtree('build', ignore_errors=True)
    Path('build').mkdir(parents=True, exist_ok=True)
    for file_path in Path('src').rglob('*'):
        if file_path.is_dir():
            for exclusion in EXCLUSIONS:
                if str(file_path).startswith(join('src', exclusion)):
                    break
            else:
                Path('build').joinpath(file_path.relative_to('src')).mkdir(parents=True, exist_ok=True)
        if file_path.is_file():
            for exclusion in EXCLUSIONS:
                if str(file_path).startswith(join('src', exclusion)):
                    break
            else:
                Path('build').joinpath(file_path.relative_to('src')).parent.mkdir(parents=True, exist_ok=True)
                copy(file_path, Path('build').joinpath(file_path.relative_to('src')))
    rmtree('src/web/dist', ignore_errors=True)
    run(['ng', 'build', '--configuration', 'production'], cwd=Path('src/web/src').absolute(), check=True, stdout=None)
    sleep(1)
    Path('build/web').mkdir(parents=True, exist_ok=True)
    for file_path in Path('src/web/dist/web/browser').rglob('*'):
        if file_path.is_dir():
            Path('build/web').joinpath(file_path.relative_to('src/web/dist/web/browser')).mkdir(parents=True, exist_ok=True)
        if file_path.is_file():
            Path('build/web').joinpath(file_path.relative_to('src/web/dist/web/browser')).parent.mkdir(parents=True, exist_ok=True)
            copy(file_path, Path('build/web').joinpath(file_path.relative_to('src/web/dist/web/browser')))


if __name__ == '__main__':
    main()
