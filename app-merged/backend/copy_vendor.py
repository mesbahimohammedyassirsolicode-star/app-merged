import shutil
shutil.rmtree('vendor', ignore_errors=True)
shutil.copytree('../../backend/vendor', 'vendor')
