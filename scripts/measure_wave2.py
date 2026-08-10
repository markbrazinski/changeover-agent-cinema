import time
import requests
import json

BASE_URL = "http://localhost:8008"

def measure_wave2_run(run_num):
    print(f"\n--- WAVE 2 TIMING MEASUREMENT: RUN #{run_num} ---")
    start_time = time.time()

    # Wave 2 Start Marker: Overall video time 0:49.00s
    t_start = 49.00
    
    # 1. Move to 2-channel baseline (CH-14 Tears of Steel vs CH-27 Sintel)
    t_baseline = time.time()
    elapsed_baseline = t_baseline - start_time + t_start
    print(f"[{elapsed_baseline:05.2f}s] Wave 2 entry point: 2-channel baseline active (09a_contention_baseline).")

    # 2. Simulate natural 5.0s playback before concurrent fault injection
    time.sleep(5.0)
    t_fault = time.time()
    elapsed_fault = t_fault - start_time + t_start
    print(f"[{elapsed_fault:05.2f}s] Concurrent caption failures injected: CH-14 & CH-27 failing (09_contention_failing).")

    # 3. Invoke /contention/run (Grafana Cloud MCP + Gemini ADK + Deterministic Policy Engine)
    t_inv_start = time.time()
    res = requests.post(f"{BASE_URL}/contention/run?human_authorizer=operator:mark&mode=real").json()
    t_inv_end = time.time()
    
    elapsed_inv_start = t_inv_start - start_time + t_start
    elapsed_inv_end = t_inv_end - start_time + t_start
    
    print(f"[{elapsed_inv_start:05.2f}s] Investigation started -> Grafana MCP invoked.")
    print(f"[{elapsed_inv_end:05.2f}s] Evidence separated, backup verified, capacity (1/2) & tiers (CH-14 Emergency / CH-27 General) evaluated.")
    print(f"[{elapsed_inv_end:05.2f}s] Recommendation ready -> Human Gate VISIBLE (10_contention_decision).")

    # 4. Simulate human operator authorization click at proposed VO target (1:32 / 92.00s)
    t_operator_click = 92.00 # 1:32
    print(f"[{t_operator_click:05.2f}s] Operator authorizes tradeoff (11_contention_authorized).")

    # 5. Failover execution delay (2.0s hold to PARTIALLY MITIGATED)
    t_terminal = t_operator_click + 2.00
    print(f"[{t_terminal:05.2f}s] Failover complete -> CH-14 restored, CH-27 degraded, terminal PARTIALLY MITIGATED (12_terminal).")

    return {
        "run": run_num,
        "entry": elapsed_baseline,
        "faults": elapsed_fault,
        "inv_start": elapsed_inv_start,
        "gate_ready": elapsed_inv_end,
        "backend_latency": t_inv_end - t_inv_start,
        "operator_click": t_operator_click,
        "terminal": t_terminal,
        "priority": res.get("priority_channel"),
        "degraded": res.get("degraded_channels"),
        "untouched_proof": res.get("degraded_untouched_proof"),
    }

if __name__ == "__main__":
    runs = []
    for i in range(1, 4):
        runs.append(measure_wave2_run(i))
        time.sleep(1)

    print("\n================ WAVE 2 TIMING SUMMARY ================")
    print("Run | Entry (s) | Faults (s) | Gate Ready (s) | Backend Latency (s) | Terminal (s)")
    print("-" * 75)
    for r in runs:
        print(f"{r['run']:<3} | {r['entry']:<9.2f} | {r['faults']:<10.2f} | {r['gate_ready']:<14.2f} | {r['backend_latency']:<19.3f} | {r['terminal']:<12.2f}")
