
function sendMessage() {
  const input = document.getElementById("user-input");
  const messages = document.getElementById("chat-messages");

  if (input.value.trim() !== "") {
    const userMessage = document.createElement("div");
    userMessage.textContent = "You: " + input.value;
    messages.appendChild(userMessage);


    const botMessage = document.createElement("div");
    botMessage.textContent = "Bot: Sorry, I'm still in learning Phase!";
    messages.appendChild(botMessage);
    messages.scrollTop = messages.scrollHeight;
    input.value = "";
  }
  // messages.scrollTop = messages.scrollHeight;

}

var navlinks = document.getElementById("navlinks");
function showmenu() {
  navlinks.style.right = "0";
}
function hidemenu() {
  navlinks.style.right = "-200px";
}



// logic for hiding image


function hideMessage() {
  const fileInput = document.getElementById('input-image');
  const message = document.getElementById('input-message').value;
  if (!fileInput.files[0]) {
    alert("Please select an image to hide your message.");
    return;
  }
  const password = prompt("Enter a password to encrypt the message:");

  if (!password) {
    alert("Password is required!");
    return;
  }

  const encrypted = CryptoJS.AES.encrypt(message, password).toString();

  const canvas = document.getElementById('canvas');
  const downloadLink = document.getElementById('download-link');

  // ✅ SEND DATA TO BACKEND
const base64Image = canvas.toDataURL();
const payload = {
  userId: "demo123", // replace with dynamic ID later if using auth
  encodedImage: base64Image,
  message: message
};

fetch("http://localhost:5000/api/steg/save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => {
  console.log("✅ Image saved to server:", data);
})
.catch(error => {
  console.error("❌ Failed to save image:", error);
});


  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const binaryMsg = toBinary(encrypted) + '1111111111111110'; // EOF pattern
      hideBinaryInPixels(imgData.data, binaryMsg);
      ctx.putImageData(imgData, 0, 0);

      downloadLink.href = canvas.toDataURL();
      downloadLink.download = 'encoded-image.png';
      downloadLink.style.display = 'block';
      downloadLink.textContent = 'Download Encoded Image';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(fileInput.files[0]);
}

function toBinary(text) {
  return text.split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

function hideBinaryInPixels(data, binaryMsg) {
  for (let i = 0; i < binaryMsg.length; i++) {
    data[i * 4] = (data[i * 4] & ~1) | parseInt(binaryMsg[i]); // Modify red channel LSB
  }
}


// EXTRACTION PART
function revealMessage() {
  const fileInput = document.getElementById('decrypt-image');
  const output = document.getElementById('revealed-message');
  const password = prompt("Enter the password to decrypt the message:");

  if (!password) {
    alert("Password is required!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const binary = extractBinary(imgData.data);
      const encryptedMessage = binaryToText(binary);

      try {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, password);
        const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedMessage) throw "Decryption failed";

        output.textContent = "🔓 Hidden Message: " + decryptedMessage;
      } catch (e) {
        output.textContent = "❌ Incorrect password or corrupted image!";
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(fileInput.files[0]);
}

// Get binary from red channel LSBs
function extractBinary(data) {
  let binary = '';
  for (let i = 0; i < data.length; i += 4) {
    binary += (data[i] & 1).toString();
    if (binary.endsWith('1111111111111110')) {
      break;
    }
  }
  return binary.slice(0, -16); // remove EOF
}

function binaryToText(binary) {
  let text = '';
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    text += String.fromCharCode(parseInt(byte, 2));
  }
  return text;
}
