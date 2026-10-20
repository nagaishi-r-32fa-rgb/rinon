  const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxLLDHKNPPFQnp1Vpxo_T9tboahamyMtzD9nj5FWfom33i8rex5mdbGpuFG_SnCUdDxMw/exec";

  let html5QrCode = null;
  let isProcessing = false;

  async function startCamera() {
    document.getElementById('err-msg').innerText = "";
    
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("preview");
    }

    const config = { fps: 15, qrbox: { width: 250, height: 250 } };

    try {
      // 背面カメラを優先して直接起動
      await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess);
      document.getElementById('start-btn').style.display = 'none';
    } catch (err) {
      try {
        // インカメラ等で再試行
        await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess);
        document.getElementById('start-btn').style.display = 'none';
      } catch (e) {
        document.getElementById('err-msg').innerText = "カメラの起動に失敗しました。ブラウザの設定でカメラを許可してください。";
      }
    }
  }

  function onScanSuccess(decodedText) {
    if (isProcessing) return;
    isProcessing = true;

    playBeep();
    showResult('bg-error', '照合中...', 'チケット情報を確認しています', '');

    // GAS API へデータ送信
    fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({ ticketId: decodedText }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(res => res.json())
    .then(data => handleResult(data))
    .catch(err => handleError(err));
  }

  function handleResult(res) {
    let bgClass = 'bg-error';
    let html = '';

    if (res.status === 'FIRST_ENTRY') {
      bgClass = 'bg-first';
} else if (res.status === 'RE_ENTRY') {
      bgClass = 'bg-reentry';
      } else if (res.status === 'DENIED') {
      bgClass = 'bg-denied';
        } else {
      bgClass = 'bg-invalid';
      html = `<div style="text-align:center;">${res.message}</div>`;
    }

    showResult(bgClass, res.title, res.subtitle || '', html);
    setTimeout(resetScanner, 2500);
  }

  function handleError(err) {
    showResult('bg-error', '通信エラー', '接続を確認してください', err.toString());
    setTimeout(resetScanner, 3000);
  }

  function showResult(bgClass, title, subtitle, infoHtml) {
    const screen = document.getElementById('result-screen');
    screen.className = bgClass;
    document.getElementById('res-title').innerText = title;
    document.getElementById('res-subtitle').innerText = subtitle;
    document.getElementById('info-box').innerHTML = infoHtml;
    screen.style.display = 'flex';
  }

  function resetScanner() {
    document.getElementById('result-screen').style.display = 'none';
    isProcessing = false;
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch(e){}
  }
