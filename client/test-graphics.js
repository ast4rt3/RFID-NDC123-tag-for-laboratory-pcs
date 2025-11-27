```javascript
const si = require('systeminformation');

console.log('Starting graphics test...');

async function testGraphics() {
  try {
    console.log('Calling si.graphics()...');
    const graphics = await si.graphics();
    console.log('Graphics data received:');
    console.log(JSON.stringify(graphics, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testGraphics();
```
