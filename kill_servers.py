import subprocess
import time

pids = [15264, 14804, 3456]
for pid in pids:
    try:
        subprocess.run(['taskkill', '/PID', str(pid), '/F'], check=False)
        print(f"Killed PID {pid}")
    except Exception as e:
        print(f"Failed to kill {pid}: {e}")

time.sleep(2)
print("Done")
