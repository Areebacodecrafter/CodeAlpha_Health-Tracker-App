// FINAL script.js with real-time sync for workouts and profile

const db = firebase.firestore();

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  if (!tabs.length || !contents.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById(tab.dataset.tab);
      if (content) content.classList.add('active');
    });
  });
  tabs[0].click();
}

function initThemeToggle() {
  const toggle = document.getElementById('toggle-theme');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      updateChartThemes();
    });
  }
}

function initProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      name: form.name?.value || '',
      age: +form.age?.value || 0,
      weight: +form.weight?.value || 0,
      height: +form.height?.value || 0,
      goal: form.goal?.value || ''
    };
    db.collection('users').doc('me').set(data).then(() => {
      form.reset();
    });
  });
}

function loadProfileRealtime() {
  const display = document.getElementById('profile-display');
  if (!display) return;

  display.innerHTML = '<p class="loading">Loading profile...</p>';
  db.collection('users').doc('me').onSnapshot(doc => {
    if (!doc.exists) return (display.innerHTML = '<p>No profile yet.</p>');
    const { name, age, weight, height, goal } = doc.data();
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    display.innerHTML = `
      <div class="profile-card">
        <h3>${name}, ${age} yrs</h3>
        <p>Goal: ${goal}</p>
        <p>Weight: ${weight}kg, Height: ${height}cm</p>
        <p>BMI: ${bmi}</p>
      </div>`;
  });
}

function initWorkoutForm() {
  const form = document.getElementById('workout-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const workout = {
      name: form['workout-name']?.value || 'Workout',
      duration: +form.duration?.value || 0,
      calories: +form.calories?.value || 0,
      timestamp: new Date()
    };
    db.collection('workouts').add(workout).then(() => {
      form.reset();
    });
  });
}

let chartInstances = {};

function loadWorkoutsRealtime() {
  const list = document.getElementById('workouts');
  if (!list) return;

  db.collection('workouts').orderBy('timestamp', 'desc').onSnapshot(snap => {
    if (snap.empty) {
      list.innerHTML = '<p>No workouts yet. Let\'s get moving!</p>';
      return;
    }
    list.innerHTML = '';
    snap.forEach(doc => {
      const w = doc.data();
      list.innerHTML += `<li><strong>${w.name}</strong>: ${w.duration} min · ${w.calories} kcal</li>`;
    });
  });
}

function loadChartsRealtime() {
  db.collection('workouts').orderBy('timestamp', 'desc').onSnapshot(snap => {
    const labels = [], durations = [], calories = [];
    snap.forEach((doc, i) => {
      labels.push(`Day ${i + 1}`);
      durations.push(doc.data().duration);
      calories.push(doc.data().calories);
    });
    drawChart('summaryChart', 'bar', labels, durations, 'Duration (min)');
    drawChart('dailyChart', 'line', labels, calories, 'Calories Burned');
  });
}

function drawChart(id, type, labels, data, label) {
  const ctx = document.getElementById(id);
  if (!ctx) {
    console.warn(`Canvas element with ID '${id}' not found.`);
    return;
  }

  const color = document.body.classList.contains('dark') ? '#D9D2B0' : '#254559';
  const bgColor = '#A9C6D9';

  const context = ctx.getContext('2d');
  if (chartInstances[id] instanceof Chart) {
    chartInstances[id].destroy();
  }
  chartInstances[id] = new Chart(context, {
    type,
    data: {
      labels,
      datasets: [{ label, data, backgroundColor: bgColor, borderColor: color, fill: type === 'line' }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: color
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: color
          },
          grid: {
            color: color + '33'
          }
        },
        x: {
          ticks: {
            color: color
          },
          grid: {
            color: color + '33'
          }
        }
      }
    }
  });
}

function updateChartThemes() {
  loadChartsRealtime();
}

function showSplash() {
  const splash = document.createElement('div');
  splash.className = 'splash';
  splash.innerHTML = `
    <div class="quote-box">
      <h2>"Push yourself, because no one else is going to do it for you."</h2>
      <p class="sub">Loading Health Tracker...</p>
    </div>`;
  document.body.appendChild(splash);
  setTimeout(() => splash.remove(), 3000);
}

// Init All
window.addEventListener('DOMContentLoaded', () => {
  showSplash();
  initTabs();
  initThemeToggle();
  initProfileForm();
  initWorkoutForm();
  loadProfileRealtime();
  loadWorkoutsRealtime();
  loadChartsRealtime();
});
