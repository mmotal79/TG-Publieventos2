fetch('http://localhost:3000/api/landing/test-sync-sheets', {
  method: 'POST',
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
