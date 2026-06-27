import fs from 'fs';

async function run() {
  try {
    const cookies = fs.readFileSync('../cookies.txt', 'utf8');
    const tokenLine = cookies.split('\n').find(line => line.includes('jwt'));
    const token = tokenLine ? tokenLine.split('\t').pop() : null;

    const formData = new FormData();
    formData.append('fullName', 'John Doe frontend');
    formData.append('guardianName', '');
    formData.append('cnic', '');
    formData.append('phone', '0987654321');
    formData.append('email', 'john.doe10@example.com');
    formData.append('password', 'Pass123!');
    formData.append('dob', '');
    formData.append('gender', 'Male');
    formData.append('address', '');
    formData.append('reference', '');
    formData.append('academicQualification', '');
    formData.append('professionalQualification', '');
    formData.append('experience', '');
    formData.append('previousSchool', '');
    formData.append('subjects', '');
    formData.append('assignedClass', '');
    formData.append('assignedSection', '');
    formData.append('department', '');
    formData.append('joiningDate', '2026-06-27');
    formData.append('basicSalary', '0');
    formData.append('status', 'Active');
    formData.append('remarks', '');

    const res = await fetch('http://127.0.0.1:5001/api/teachers', {
      method: 'POST',
      headers: {
        'Cookie': `jwt=${token}`
      },
      body: formData
    });
    
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (err) {
    console.error(err);
  }
}
run();
