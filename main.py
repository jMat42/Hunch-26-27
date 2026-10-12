import csv

crit_battery_level = 40
warn_battery_level = 65
crit_motor_current_amps = 4
warn_motor_current_amps = 3
crit_motor_temp_celsius = 80
warn_motor_temp_celsius = 60
crit_wheel_speed_rpm = 40
warn_wheel_speed_rpm = 70

with open('data/simulated_mission1_telemetry.csv', newline="") as csvfile:
    reader = csv.DictReader(csvfile)
    for read_number, row in enumerate(reader, start=1):
        print()
        print(f"========== READ {read_number} ==========")
        print(f"Time: {row['timestamp_utc']}")

        battery_level = float(row['battery_level_percent'])
        motor_current_amps = float(row['motor_current_amps'])
        motor_temp_celsius = float(row['motor_temperature_c'])
        wheel_speed_rpm = float(row['wheel_speed_rpm'])
        joint_status = row['joint_status'].strip().upper()

        if battery_level < crit_battery_level:
            print(f"🚨 Battery: CRITICAL ({battery_level}%)")
        elif battery_level < warn_battery_level:
            print(f"⚠️ Battery: WARNING ({battery_level}%)")
        else:
            print("✓ Battery: NORMAL")

        if motor_current_amps > crit_motor_current_amps:
            print(f"🚨 Motor Current: CRITICAL ({motor_current_amps} A)")
        elif motor_current_amps > warn_motor_current_amps:
            print(f"⚠️ Motor Current: WARNING ({motor_current_amps} A)")
        else:
            print("✓ Motor Current: NORMAL")
        if motor_temp_celsius > crit_motor_temp_celsius:
            print(f"🚨 Motor Temperature: CRITICAL ({motor_temp_celsius}°C)")
        elif motor_temp_celsius > warn_motor_temp_celsius:
            print(f"⚠️ Motor Temperature: WARNING ({motor_temp_celsius}°C)")
        else:
            print("✓ Motor Temperature: NORMAL")

        if wheel_speed_rpm < crit_wheel_speed_rpm:
            print(f"🚨 Wheel Speed: CRITICAL ({wheel_speed_rpm} RPM)")
        elif wheel_speed_rpm < warn_wheel_speed_rpm:
            print(f"⚠️ Wheel Speed: WARNING ({wheel_speed_rpm} RPM)")
        else:
            print("✓ Wheel Speed: NORMAL")

        if joint_status == "LIMITED":
            print(f"⚠️ Joint Status: WARNING ({joint_status})")
        elif joint_status == "FAILED":
            print(f"🚨 Joint Status: CRITICAL ({joint_status})")
        else:
            print("✓ Joint Status: NORMAL")

        print("----------------------------------")
