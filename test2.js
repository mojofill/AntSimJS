const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'gray';
ctx.fillRect(0, 0, 10, 10);
let data = ctx.getImageData(0, 0, 10, 10).data;
console.log(`${data[0]}, ${data[1]}, ${data[2]}`);
