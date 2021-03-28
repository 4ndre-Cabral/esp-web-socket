window.addEventListener("load", function(){ //when page loads

  // Componentes
  var lightbox = document.getElementById("cb2");
  var window = document.getElementById("cb3");
  var prompt = document.getElementById("prompt");
  var messagePrompt = document.getElementById("message_prompt");

  // Variáveis de controle
  var windowPosition = 'window_position'
  var lighState = 'ligh_state'
  var contador = 0
  var state = {
    OPEN: 'open',
    CLOSE: 'close'
  }
  // Estado inicial janela
  if(!localStorage.getItem(windowPosition)) {
    localStorage.setItem(windowPosition, state.CLOSE)
  }
  // Estado inicial lampada
  if(!localStorage.getItem(lighState)) {
    localStorage.setItem(lighState, state.CLOSE)
  } else {
    lightbox.checked = localStorage.getItem(lighState) === state.OPEN
  }

  // Estado inicial
  messagePrompt.innerHTML = "Esperando placa conectar"
  window.disabled = true
  lightbox.disabled = true

  // WebSocket
  webSocket = new WebSocket("ws://192.168.4.129:8080")
  webSocket.onopen = function(e) {
    webSocket.send("hello_from_front");
  };

  webSocket.onmessage = function(event) {
    let message = event.data
    switch (message) {
      case 'hello_from_esp':
        // se for a primeira mensagem
        if (contador === 0) {
          messagePrompt.innerHTML = ""
          prompt.style.display = "none"
          window.checked = false
          window.disabled = false
          lightbox.disabled = false
          contador++
        }
        if (!window.disabled) {
          messagePrompt.innerHTML = ""
          prompt.style.display = "none"
        }
        break;
      case 'esp_closed':
        alert('Placa desconectada!')
        messagePrompt.innerHTML = "Esperando placa conectar"
        prompt.style.display = "block"
        break
      case 'open_window':
        window.disabled = true
        messagePrompt.innerHTML = "Abrindo janela"
        prompt.style.display = "block"
        localStorage.setItem(windowPosition, state.OPEN)
        break;
      case 'close_window':
        window.disabled = true
        messagePrompt.innerHTML = "Fechando janela"
        prompt.style.display = "block"
        localStorage.setItem(windowPosition, state.CLOSE)
        break;
      case 'end_window':
        messagePrompt.innerHTML = ""
        prompt.style.display = "none"
        window.checked = false
        window.disabled = false
        break;
      case 'ON':
        lightbox.checked = true
        localStorage.setItem(lighState, state.OPEN)
        break
      case 'OFF':
        lightbox.checked = false
        localStorage.setItem(lighState, state.CLOSE)
        break
      default:
        break;
    }
  };

  // Trigger botões
  lightbox.addEventListener("change", function() {
    let state = Number(this.checked) === 1 ? "ON" : "OFF"
    webSocket.send(state);
  });
  window.addEventListener("change", function() {
    if (Number(this.checked) === 1) {
      switch (localStorage.getItem(windowPosition)) {
        case state.OPEN:
          webSocket.send("OFF_WINDOW")
          break
        case state.CLOSE:
          webSocket.send("ON_WINDOW")
          break
      }
    }
  });
});