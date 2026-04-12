import 'dotenv/config';
import { db } from './src/db/index.js';
import { users } from './src/db/schema/users.js';
import { signToken } from './src/utils/jwt.js';

async function test() {
  const userList = await db.select().from(users).limit(1);
  if(!userList.length) {
    console.log('No user');
    return;
  }
  const token = signToken({ id: userList[0].id, roleId: userList[0].roleId });
  console.log('Token:', token);

  const res = await fetch('http://localhost:3000/api/tag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({
      name: 'Test Tag',
      slug: 'test-tag-' + Date.now(),
      color: '#112233',
      isActive: true
    })
  });
  console.log('POST Status:', res.status);
  const data = await res.json();
  console.log('POST Data:', data);
  
  if (data.success && data.data) {
     const tagId = data.data.id;
     
     // Test Edit
     const resEdit = await fetch('http://localhost:3000/api/tag/' + tagId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({
            name: 'Test Tag Updated',
            slug: 'test-tag-updated-' + Date.now(),
            color: '#332211',
            isActive: false
        })
     });
     console.log('PUT Status:', resEdit.status);
     console.log('PUT Data:', await resEdit.json());
     
     // Test Delete
     const resDel = await fetch('http://localhost:3000/api/tag/' + tagId, {
        method: 'DELETE',
        headers: {
            Authorization: 'Bearer ' + token
        }
     });
     console.log('DELETE Status:', resDel.status);
     console.log('DELETE Data:', await resDel.json());
  }

  process.exit(0);
}
test();
