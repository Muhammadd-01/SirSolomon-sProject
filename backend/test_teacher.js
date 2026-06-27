async function run() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@school.com', password: 'Password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const formData = new FormData();
    formData.append('fullName', 'John Doe');
    formData.append('phone', '1234567890');
    formData.append('basicSalary', '10000');
    formData.append('email', 'john.doe4@example.com');
    formData.append('password', 'Pass123!');
    
    // Add empty fields exactly as frontend does
    formData.append('guardianName', '');
    formData.append('cnic', '');
    formData.append('address', '');
    formData.append('gender', 'Male');
    
    const res = await fetch('http://127.0.0.1:5001/api/teachers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const result = await res.json();
    console.log("RESULT DATA:", result);
  } catch (err) {
    console.log("ERROR:", err);
  }
}
run();
