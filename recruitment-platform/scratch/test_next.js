const url = 'http://localhost:3000/api/public/jobs/receptionist-premium-resort/recommend';
fetch(url)
.then(r => r.json().then(data => {
  console.log('Next.js status:', r.status);
  console.log('Recommendations:');
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      console.log(`${index+1}. "${item.title}" (ID: ${item.id}, Category: ${item.category?.name})`);
    });
  } else {
    console.log(data);
  }
}))
.catch(err => console.error('Next.js connection error:', err));
