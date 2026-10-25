/**
 * Driver Station - Teleoperacja robota dostawczego
 */

// Globalna instancja XMLHttpRequest
var xhttp = new XMLHttpRequest();
var lightOn = false;
var activeCommand = null;

// Elementy interfejsu
var feedbackEl = document.getElementById('command-feedback');
var lightBtn = document.getElementById('btn-toggle-light');
var lightLabel = document.getElementById('light-label');

/**
 * Wysyłanie komendy do robota
 * @param {string} arg - nazwa komendy (go, back, left, right, stop, ledon, ledoff)
 */
function getsend(arg) {
  // Zapobiegamy spamowaniu identyczną komendą w pętli
  activeCommand = arg;
  updateFeedback(arg);

  xhttp.open('GET', arg + '?' + new Date().getTime(), true);
  xhttp.send();
}

/**
 * Aktualizacja etykiety informacyjnej na ekranie
 */
function updateFeedback(cmd) {
  if (!feedbackEl) return;
  var labels = {
    'go': 'RUCH: PRZÓD ▲',
    'back': 'RUCH: TYŁ ▼',
    'left': 'RUCH: LEWO ◀',
    'right': 'RUCH: PRAWO ▶',
    'stop': 'STOP ■',
    'ledon': 'ŚWIATŁO: WŁ',
    'ledoff': 'ŚWIATŁO: WYŁ'
  };
  feedbackEl.innerText = labels[cmd] || cmd.toUpperCase();
}

/**
 * Włączanie / wyłączanie oświetlenia
 */
function toggleLight() {
  lightOn = !lightOn;
  if (lightOn) {
    getsend('ledon');
    lightBtn.classList.add('active');
    lightLabel.innerText = 'Światło: WŁ';
  } else {
    getsend('ledoff');
    lightBtn.classList.remove('active');
    lightLabel.innerText = 'Światło: WYŁ';
  }
}

/**
 * Zatrzymanie robota
 */
function stopRobot() {
  getsend('stop');
}

/**
 * Rejestracja zdarzeń dla przycisków kierunkowych (Mysz + Dotyk)
 */
function bindDirectionalButton(btn) {
  var cmd = btn.getAttribute('data-cmd');

  function start(e) {
    e.preventDefault();
    btn.classList.add('pressed');
    getsend(cmd);
  }

  function end(e) {
    e.preventDefault();
    btn.classList.remove('pressed');
    getsend('stop');
  }

  btn.addEventListener('mousedown', start);
  btn.addEventListener('mouseup', end);
  btn.addEventListener('mouseleave', function () {
    if (btn.classList.contains('pressed')) end(new Event('mouseleave'));
  });

  btn.addEventListener('touchstart', start, { passive: false });
  btn.addEventListener('touchend', end, { passive: false });
  btn.addEventListener('touchcancel', end, { passive: false });
}

// Inicjalizacja przycisków D-Pada
document.querySelectorAll('.d-btn').forEach(bindDirectionalButton);

// Przycisk STOP
var stopBtn = document.getElementById('btn-emergency-stop');
stopBtn.addEventListener('click', stopRobot);
stopBtn.addEventListener('touchstart', function(e) {
  e.preventDefault();
  stopRobot();
}, { passive: false });

// Przycisk Światło
lightBtn.addEventListener('click', toggleLight);

/**
 * Obsługa sterowania z klawiatury (WASD + Strzałki, Spacja = STOP, L = Światło)
 */
var keyCommandMap = {
  'KeyW': 'go',
  'ArrowUp': 'go',
  'KeyS': 'back',
  'ArrowDown': 'back',
  'KeyA': 'left',
  'ArrowLeft': 'left',
  'KeyD': 'right',
  'ArrowRight': 'right'
};

var activeKeys = {};

window.addEventListener('keydown', function (e) {
  if (e.repeat) return; // ignorujemy autorepeat klawiatury

  if (e.code === 'Space') {
    e.preventDefault();
    stopRobot();
    return;
  }

  if (e.code === 'KeyL') {
    toggleLight();
    return;
  }

  var cmd = keyCommandMap[e.code];
  if (cmd) {
    e.preventDefault();
    activeKeys[e.code] = true;
    highlightButton(cmd, true);
    getsend(cmd);
  }
});

window.addEventListener('keyup', function (e) {
  var cmd = keyCommandMap[e.code];
  if (cmd) {
    delete activeKeys[e.code];
    highlightButton(cmd, false);

    // Jeśli żaden klawisz kierunkowy nie jest już wciśnięty, zatrzymaj
    if (Object.keys(activeKeys).length === 0) {
      getsend('stop');
    }
  }
});

function highlightButton(cmd, add) {
  var btn = document.querySelector('.d-btn[data-cmd="' + cmd + '"]');
  if (btn) {
    if (add) btn.classList.add('pressed');
    else btn.classList.remove('pressed');
  }
}

/**
 * Zegar telemetryczny HUD
 */
function updateClock() {
  var now = new Date();
  var clockEl = document.getElementById('hud-clock');
  if (clockEl) {
    clockEl.innerText = now.toTimeString().split(' ')[0];
  }
}
setInterval(updateClock, 1000);
updateClock();