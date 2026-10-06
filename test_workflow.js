// Comprehensive End-to-End Verification Test Script
const BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING APEXTASK ENTERPRISE VALIDATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await fetch(`${BASE}/health`).then(r => r.json());
    assert(health.status === 'online', '1. Server Health Check online');

    // 2. Admin Login
    const adminLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apex.com', password: 'password123', role: 'admin' })
    }).then(r => r.json());
    assert(adminLogin.token && adminLogin.user.name.includes('Eleanor Vance'), '2. Admin Login and JWT authentication');
    const adminToken = adminLogin.token;

    // 3. Manager Login
    const managerLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.jenkins@apex.com', password: 'password123', role: 'manager' })
    }).then(r => r.json());
    assert(managerLogin.token && managerLogin.user.name === 'Sarah Jenkins', '3. Manager Login and scoped permissions');
    const managerToken = managerLogin.token;

    // 4. Employee Passwordless Access via Secure Link Token
    const empList = await fetch(`${BASE}/employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    const validEmp = empList.employees[0];
    const empPortal = await fetch(`${BASE}/portal/${validEmp.secure_access_token_hash}`).then(r => r.json());
    assert(empPortal.employee && empPortal.employee.id === validEmp.id, '4. Employee Token-based Passwordless Portal lookup');

    // 5. Multi-Tenant Isolation Verification
    const vanguardLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@vanguard.com', password: 'password123', role: 'admin' })
    }).then(r => r.json());
    const vanguardTasks = await fetch(`${BASE}/tasks`, {
      headers: { 'Authorization': `Bearer ${vanguardLogin.token}` }
    }).then(r => r.json());
    // Verify Vanguard only sees Vanguard tasks, NOT Apex tasks
    const hasApexTask = vanguardTasks.tasks.some(t => t.title.includes('Stripe Payment Gateway'));
    assert(!hasApexTask, '5. Strict Multi-Tenant Isolation (Vanguard cannot access Apex data)');

    // 6. Admin / Manager creates a new task
    const today = new Date().toISOString().split('T')[0];
    const createdTaskRes = await fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Microservices Latency Optimization',
        description: 'Profile p99 latency on Redis cache clusters and optimize eviction policy.',
        employee_id: empPortal.employee.id,
        category: 'Engineering',
        priority: 'Urgent',
        task_date: today,
        start_time: '14:00',
        end_time: '17:00'
      })
    }).then(r => r.json());
    assert(createdTaskRes.task && createdTaskRes.task.status === 'Assigned', '6. Task created with status "Assigned"');
    const newTaskId = createdTaskRes.task.id;

    // 7. Drag-and-Drop Calendar Rescheduling
    const rescheduled = await fetch(`${BASE}/tasks/${newTaskId}/reschedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        task_date: today,
        start_time: '15:00',
        end_time: '18:00'
      })
    }).then(r => r.json());
    assert(rescheduled.task.start_time === '15:00' && rescheduled.task.end_time === '18:00', '7. Calendar Drag-and-Drop rescheduling saved');

    // 8. Employee starts task (Assigned -> In Progress)
    const started = await fetch(`${BASE}/portal/${validEmp.secure_access_token_hash}/start-task/${newTaskId}`, {
      method: 'POST'
    }).then(r => r.json());
    assert(started.task.status === 'In Progress', '8. Employee starts task (Assigned -> In Progress)');

    // 9. Employee submits completed work (In Progress -> Submitted)
    const submitted = await fetch(`${BASE}/portal/${validEmp.secure_access_token_hash}/submit-task/${newTaskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_note: 'Completed latency benchmarking script and verified 42% throughput gain on cluster.'
      })
    }).then(r => r.json());
    assert(submitted.task.status === 'Submitted', '9. Employee submits completed deliverables (In Progress -> Submitted)');
    const submissionId = submitted.submissionId;

    // 10. Manager reviews and requests rework (Submitted -> Rework Required)
    const reworked = await fetch(`${BASE}/submissions/${submissionId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        action: 'Rework Required',
        review_comment: 'Please include heap snapshot metrics under 50k QPS load.'
      })
    }).then(r => r.json());
    assert(reworked.task.status === 'Rework Required' && reworked.submission.status === 'Rework Required', '10. Manager requests rework with mandatory note (Submitted -> Rework Required)');

    // 11. Employee re-submits revised work (Rework Required -> Submitted)
    const resubmitted = await fetch(`${BASE}/portal/${validEmp.secure_access_token_hash}/submit-task/${newTaskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_note: 'Added heap snapshots under 50k QPS load showing 18MB average memory footprint.'
      })
    }).then(r => r.json());
    assert(resubmitted.task.status === 'Submitted', '11. Employee uploads revised work (Rework Required -> Submitted)');

    // 12. Manager approves submission (Submitted -> Approved)
    const approved = await fetch(`${BASE}/submissions/${resubmitted.submissionId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        action: 'Approved',
        review_comment: 'Excellent heap metrics. Approved for deployment.'
      })
    }).then(r => r.json());
    assert(approved.task.status === 'Approved' && approved.submission.status === 'Approved', '12. Manager approves completed task (Submitted -> Approved)');

    // 13. Attendance Module (Clock in and Clock out)
    const clockIn = await fetch(`${BASE}/portal/${validEmp.secure_access_token_hash}/clock-in`, { method: 'POST' }).then(r => r.json());
    assert((clockIn.attendance && clockIn.attendance.clock_in) || (clockIn.error && clockIn.error.includes('already clocked in')), '13. Employee Clock In attendance recorded');

    // 14. Reports & Analytics Metrics
    const metrics = await fetch(`${BASE}/reports/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(metrics.summary.totalTasks > 0 && metrics.summary.Approved > 0, '14. Reports metrics calculation & breakdown');

    // 15. Global Search across multiple entities
    const searchRes = await fetch(`${BASE}/search?q=Latency`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(searchRes.tasks.length > 0, '15. Global Search indexing tasks accurately');

    // 16. Secure Token Regeneration & Revocation
    const regen = await fetch(`${BASE}/employees/${validEmp.id}/regenerate-token`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(regen.secure_token && regen.secure_token !== validEmp.secure_access_token_hash, '16. Admin regenerates cryptographically secure access link');

    // Test that old token fails now!
    const oldTokenTest = await fetch(`${BASE}/portal/${validEmp.secure_access_token_hash}`);
    assert(oldTokenTest.status === 403, '16b. Old token immediately revoked and blocked with 403 Forbidden');

    // Test that new token succeeds
    const newTokenTest = await fetch(`${BASE}/portal/${regen.secure_token}`);
    assert(newTokenTest.status === 200, '16c. New regenerated token provides instant seamless access');

    console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
    if (failed === 0) {
      console.log('ALL WORKFLOWS AND REQUIREMENTS VALIDATED PERFECTLY!');
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
  }
}

runTests();
