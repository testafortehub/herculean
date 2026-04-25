import subprocess
import time

pids = [3456, 14804, 15264]
for pid in pids:
    try:
        subprocess.run(['taskkill', '/PID', str(pid), '/F'],
                      capture_output=True, check=False)
        print(f"Killed PID {pid}")
    except Exception as e:
        print(f"Failed to kill {pid}: {e}")

time.sleep(2)
print("Done")
