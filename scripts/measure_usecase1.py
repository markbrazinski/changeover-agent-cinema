#!/usr/bin/env python3
"""
Use Case 1 Timing Verification Script.
Executes 3 complete runs of Use Case 1 and measures exact milestone timestamps.
"""
import time
import requests

BASE_URL = "http://localhost:8008"

def measure_run(run_num: int):
    print(f"\n--- USE CASE 1 TIMING MEASUREMENT: RUN #{run_num} ---")
    t0 = time.time()
    
    # 1. Reset demo to baseline at t=0
    res_reset = requests.post(f"{BASE_URL}/demo/reset?mode=deterministic").json()
    t_reset = time.time() - t0
    print(f"[{t_reset:05.2f}s] Baseline reset complete (01_at_rest nominal).")
    
    # 2. Baseline running for 20s
    time.sleep(20.0)
    t_freeze = time.time() - t0
    print(f"[{t_freeze:05.2f}s] Right-side captions freeze injected (02_fault_injected).")
    
    res_fault = requests.post(f"{BASE_URL}/channel/inject-fault?channel=tears_of_steel&mode=deterministic").json()
    
    # 3. Natural investigation execution
    t_inv_start = time.time() - t0
    res_inv = requests.get(f"{BASE_URL}/channel/investigate?channel=tears_of_steel&mode=deterministic").json()
    t_inv_end = time.time() - t0
    
    res_backup = requests.get(f"{BASE_URL}/channel/verify-backup?channel=tears_of_steel&mode=deterministic").json()
    t_gate_ready = time.time() - t0
    
    print(f"[{t_gate_ready:05.2f}s] Investigation & backup verification complete -> Human Gate READY.")
    
    # 4. Human gate remains open until operator action at ~48s
    gate_wait = max(0.0, 48.0 - t_gate_ready)
    time.sleep(gate_wait)
    t_operator_click = time.time() - t0
    print(f"[{t_operator_click:05.2f}s] Filming operator authorizes failover (05_awaiting_approval -> 06_changed_over).")
    
    # 5. Failover execution & post-swap restoration measurement
    res_auth = requests.post(f"{BASE_URL}/channel/authorize-failover?channel=tears_of_steel&authorizer=operator:mark&mode=deterministic").json()
    t_restore = time.time() - t0
    print(f"[{t_restore:05.2f}s] Failover executed -> Captions visibly restored (post_swap_offset={res_auth.get('post_swap_measured_offset')}s).")
    
    return {
        "run": run_num,
        "freeze": t_freeze,
        "inv_start": t_inv_start,
        "gate_ready": t_gate_ready,
        "operator_click": t_operator_click,
        "restoration": t_restore,
        "restore_delta": t_restore - t_operator_click,
    }

if __name__ == "__main__":
    runs = []
    for i in range(1, 4):
        runs.append(measure_run(i))
        time.sleep(1.0)
    
    print("\n================ USE CASE 1 TIMING SUMMARY ================")
    print(f"{'Run':<6} | {'Freeze (s)':<12} | {'Gate Ready (s)':<16} | {'Operator Click (s)':<20} | {'Restored (s)':<14} | {'Restore Delta (s)':<18}")
    print("-" * 95)
    for r in runs:
        print(f"{r['run']:<6} | {r['freeze']:<12.2f} | {r['gate_ready']:<16.2f} | {r['operator_click']:<20.2f} | {r['restoration']:<14.2f} | {r['restore_delta']:<18.3f}")
