import time
import requests

BASE_URL = "http://localhost:8008"

def measure_single_key_wave2(run_num):
    print(f"\n================ SINGLE-KEY WAVE 2 TEST RUN #{run_num} ================")
    start_time = time.time()

    # T+0.0s: Single press of (2) launches Wave 2 (2-channel baseline CH-14 Tears of Steel vs CH-27 Sintel)
    t_start = time.time() - start_time
    print(f"[WAVE 2 +{t_start:06.3f}s] wave2_started (09a_contention_baseline active)")

    # T+7.5s: Automatic baseline hold before concurrent caption failure injection
    time.sleep(7.5)
    t_fault = time.time() - start_time
    print(f"[WAVE 2 +{t_fault:06.3f}s] contention_fault_injected (CH-14 & CH-27 failing)")

    # T+7.5s onward: Begin real natural-speed investigation
    t_inv_start = time.time() - start_time
    print(f"[WAVE 2 +{t_inv_start:06.3f}s] investigation_started (calling Grafana MCP & Gemini ADK)")

    res = requests.post(f"{BASE_URL}/contention/run?human_authorizer=operator:mark&mode=real").json()

    t_inv_end = time.time() - start_time
    print(f"[WAVE 2 +{t_inv_end:06.3f}s] grafana_results_received")
    print(f"[WAVE 2 +{t_inv_end:06.3f}s] gemini_synthesis_completed")
    print(f"[WAVE 2 +{t_inv_end:06.3f}s] policy_evaluated (M=1 capacity vs N=2 demand)")
    print(f"[WAVE 2 +{t_inv_end:06.3f}s] human_gate_ready (10_contention_decision visible)")

    # Simulate operator reading screen & clicking AUTHORIZE PRIORITIZATION after a 10s hold
    operator_hold = 10.0
    time.sleep(operator_hold)
    t_operator = time.time() - start_time
    print(f"[WAVE 2 +{t_operator:06.3f}s] operator_authorized (AUTHORIZE PRIORITIZATION clicked)")

    t_restored = time.time() - start_time
    print(f"[WAVE 2 +{t_restored:06.3f}s] restoration_completed (CH-14 restored, CH-27 degraded)")

    # 2.0s restoration animation hold
    time.sleep(2.0)
    t_terminal = time.time() - start_time
    print(f"[WAVE 2 +{t_terminal:06.3f}s] terminal_partially_mitigated (12_terminal_partially_mitigated)")

    # 6.0s terminal hold
    time.sleep(6.0)
    t_lockup = time.time() - start_time
    print(f"[WAVE 2 +{t_lockup:06.3f}s] closing_lockup_shown")

    return {
        "run": run_num,
        "started": t_start,
        "fault": t_fault,
        "gate_ready": t_inv_end,
        "backend_latency": t_inv_end - t_inv_start,
        "operator": t_operator,
        "terminal": t_terminal,
        "lockup": t_lockup,
        "priority": res.get("priority_channel"),
        "degraded": res.get("degraded_channels"),
        "untouched": res.get("degraded_untouched_proof"),
    }

if __name__ == "__main__":
    runs = []
    for i in range(1, 4):
        runs.append(measure_single_key_wave2(i))
        time.sleep(1)

    print("\n================ WAVE 2 SINGLE-KEY TIMING SUMMARY ================")
    print("Run | Start (s) | Fault (s) | Gate Ready (s) | Backend Latency (s) | Operator Click (s) | Terminal (s)")
    print("-" * 90)
    for r in runs:
        print(f"{r['run']:<3} | {r['started']:<9.3f} | {r['fault']:<9.3f} | {r['gate_ready']:<14.3f} | {r['backend_latency']:<19.3f} | {r['operator']:<18.3f} | {r['terminal']:<12.3f}")
