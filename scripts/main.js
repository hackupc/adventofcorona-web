var currentProblemNum = 1;
var currentProblemId = '';
var problems = JSON.parse(localStorage.getItem('problems')) || [];
var user = JSON.parse(localStorage.getItem('user')) || {solved:[]}
var lastResult = {};
const problemTitleElem = document.getElementById('problem-title');
const problemStatementElem = document.getElementById('problem-statement');
const answerInputElem = document.getElementById('answer-input');
const feedbackElem = document.getElementById('feedback');
const problemListElem = document.getElementsByClassName('nav--problems')[0];
const sendElem = document.getElementById('send-button');
const userEmojiElem = document.getElementById('user-emoji');

const feedbackMessages = {
  'right-answer': 'Yay! Right answer 🥳',
  'wrong-answer': 'Ops... Wrong answer 🤒',
  'error': 'Error evaluating your answer, try later 😵',
  'require-login': 'Log in to send your answer 🙄',
};
const apiBaseUrl = 'https://corona-2w3jqbocga-ew.a.run.app'; // Production
// const apiBaseUrl = 'https://dev-2w3jqbocga-ew.a.run.app/'; // Development
var apiAuthToken = localStorage.getItem('apiAuthToken');
if(apiAuthToken && user) login(apiAuthToken, user);

// ----- Real 100vh ----- //
function updateRealVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
updateRealVH();
window.addEventListener('resize', updateRealVH);

// ----- Share button ----- //
const shareButton = document.getElementById('share');
if (navigator.share) shareButton.parentElement.style.display = 'block';
shareButton.addEventListener('click', event => {  
  event.preventDefault();
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location,
      text: `Check this out. ${document.querySelector('meta[name="description"]').content}`,
    })
    .catch(console.error);
  } else {
    // fallback
  }
});

// ----- Router ----- //
const router = new Router({
  mode: 'hash',
  page404: (path) => {
    console.log('"/' + path + '" Page not found');    
    router.navigateTo('/help');
  }
});

router.add('/', () => {
  router.navigateTo('/problem/1');
});

router.add('/help', () => {
  popup('help', 'open');
});

router.add('/login', () => {
  popup('user', 'open');
});

router.add('/problem/(:num)', displayProblem);

router.add('about', () => {
  console.log('About Page');
});

router.addUriListener();

Promise.all([
  // fetch(`data/problem-all.json`, {
  fetch(`${apiBaseUrl}/problem/all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  })
    .then(response => response.json())
    .then(content => {
      problems = content.data;
      localStorage.setItem('problems', JSON.stringify(problems));
    }),
  // fetch(`data/user.json`, {
  apiAuthToken ? fetch(`${apiBaseUrl}/user`, {
    method: 'GET',
    headers: {
      Authorization: apiAuthToken,
      'Content-Type': 'application/json;charset=utf-8',
    },
  })
    .then(response => response.json())
    .then(content => {
      if(content.error){
        console.error('Error getting user info', content.error);
      }else{
        login(apiAuthToken, content.data);
      }
    }) : undefined,
]).then((values => {
  displayProblemList();
  router.navigateTo(`/problem/${currentProblemNum}`);
}));
displayProblemList();

async function sendSolution(event) {
  if(!apiAuthToken) {
    displayResult('require-login');
    setTimeout(() => {
      popup('user', 'open');
    }, 1500);
    return;
  }

  let problem = problems.find(p => p.number === currentProblemNum);
  let userProblem = user.solved.find(p => p.number === currentProblemNum) || {phase: -1};
  if(lastResult.answer === answerInputElem.value 
    && lastResult.problem === problem.id) {
      let feedbackMessage = (lastResult.correct === undefined ? 'error' : lastResult.correct ? 'right-answer' : 'wrong-answer' );
      displayResult(feedbackMessage);
    return;
  }
  let response = await fetch(`${apiBaseUrl}/problem/submit`, {
    method: 'POST',
    headers: {
      Authorization: apiAuthToken,
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify({
      submission: answerInputElem.value,
      problem: problem.id,
      phase: userProblem.phase+1,
    }),
  })
  lastResult = await response.json();
  
  let feedbackMessage = (lastResult.correct === undefined ? 'error' : lastResult.correct ? 'right-answer' : 'wrong-answer' );
  displayResult(feedbackMessage);
}

function displayResult(message='error'){
  const feedbackMessage = feedbackMessages[message] || feedbackMessages.error;
  feedbackElem.style.display = 'none';
  feedbackElem.textContent = feedbackMessage;
  feedbackElem.dataset.message = message;
  void feedbackElem.offsetWidth;
  feedbackElem.style.display = 'block';

  if (message === 'right-answer') {
    let userProblem = user.solved.find(p => p.number === currentProblemNum);
    if(userProblem) userProblem = lastResult.solved;
    else user.solved.push(lastResult.solved);
    displayProblem();
    displayProblemList();
    problemStatementElem.scrollTop = problemStatementElem.scrollHeight;
  }
}

function displayUser(user){
  let popupElem = document.querySelector('.popup[data-popup="user"]');
  let buttonElem = document.getElementById('popup-user-send');
  let titleElem = document.getElementById('popup-user-title');
  let popupUsernameElem = popupElem.querySelector('input[name="username"]');
  // let popupEmailElem = popupElem.querySelector('input[name="email"]');
  // let popupEmailLabelElem = popupElem.querySelector('label[for="popup-email"]');
  let popupPasswordElem = popupElem.querySelector('input[name="password"]');
  let popupPasswordLabelElem = popupElem.querySelector('label[for="popup-password"]');
  let popupEmojiElem = popupElem.querySelector('input[name="emoji"]');
  let popupEmojiLabelElem = popupElem.querySelector('label[for="popup-emoji"]');
  let popupCheckboxElem = popupElem.querySelector('.popup__checkbox');


  userEmojiElem.textContent = user.emoji;
  buttonElem.textContent = 'Log out';
  buttonElem.classList.add('logout');
  buttonElem.onclick = () => {sendUserLogoutForm();};
  titleElem.textContent = 'Account';
  popupUsernameElem.value = user.username;
  popupUsernameElem.disabled = true;
  // popupEmailElem.value = user.email;
  // popupEmailElem.disabled = true;
  popupEmojiElem.value = user.emoji;
  popupEmojiElem.disabled = true;
  popupEmojiLabelElem.textContent = 'Favorite Emoji';
  popupPasswordElem.disabled = true;
  popupPasswordElem.style.display = 'none';
  popupPasswordLabelElem.style.display = 'none';
  popupCheckboxElem.disabled = true;
  popupCheckboxElem.style.display = 'none';
}

function displayProblem(problemNum=currentProblemNum) {
  currentProblemNum = parseInt(problemNum);
  let problem = problems.find(p => p.number === currentProblemNum);
  let userProblem = user.solved.find(p => p.id === problem.id) || {phase:-1};
  answerInputElem.value = userProblem.solution || '';
  feedbackElem.style.display = 'none';
  let elem = document.querySelector('.nav--problems > .active')
  if(elem) elem.classList.remove('active');

  document.querySelector(`.nav--problems > [data-number="${currentProblemNum}"]`).classList.add('active');
  if(problem.released){
    sendElem.disabled = false;
    answerInputElem.disabled = false;
    problemTitleElem.textContent = `Problem ${problem.number}`;
    problemStatementElem.innerHTML = problem.phases
      .filter((phase, i) => i <= userProblem.phase + 1)
      .reduce((total, phase, i) => `${total}<h2>${ i<=userProblem.phase ? '✅ ' : '❌ '}Phase ${i+1}</h2><p>${phase.description}</p>`, '');
  }else {
    sendElem.disabled = true;
    answerInputElem.disabled = true;
    problemTitleElem.textContent = `Problem ${problem.number}` || 'Future problem';
    let dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    problemStatementElem.textContent = `Not available. Wait until ${new Date(problem.release_time).toLocaleTimeString('en-ES', dateOptions)}.`;
  }
}

function displayProblemList() {
  problemListElem.innerHTML = problems.reduce((prev, problem) => {
    let userProblem = user.solved.find(p => p.id === problem.id);
    return `${prev}<li class="${problem.released ? 'available' : ''} ${userProblem ? 'done' : ''}" data-id="${problem.id}" data-number="${problem.number}"><a href="#/problem/${problem.number}" title="Problem ${problem.number}">${problem.number}</a></li>`
  }, '');
}


async function sendUserForm() {
  let popupElem = document.querySelector('.popup[data-popup="user"]');
  let buttonElem = document.getElementById('popup-user-send');

  let popupUsernameElem = popupElem.querySelector('input[name="username"]');
  // let popupEmailElem = popupElem.querySelector('input[name="email"]');
  let popupPasswordElem = popupElem.querySelector('input[name="password"]');
  let popupEmojiElem = popupElem.querySelector('input[name="emoji"]');
  let popupCheckboxElem = popupElem.querySelector('#popup-checkbox');

  let data = {
    username: popupUsernameElem.value || undefined,
    // email: popupEmailElem.value || undefined,
    email: `${popupUsernameElem.value || 'user'}@fake.com`,
    password: popupPasswordElem.value || undefined,
    emoji: popupEmojiElem.value || undefined,
  };

  let error = false;

  if(!data.username){
    error = true;
    popupUsernameElem.classList.add('invalid');
    console.error('Invalid username');
  } else {
    popupUsernameElem.classList.remove('invalid');
  }
  if(data.emoji && !(/^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])$/.test(data.emoji))){
    error = true;
    popupEmojiElem.classList.add('invalid');
    console.error('Invalid emoji');
  } else {
    popupEmojiElem.classList.remove('invalid');
  }
  // if(data.email && !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email))){
  //   error = true;
  //   popupEmailElem.classList.add('invalid');
  //   console.error('Invalid email');
  // } else {
  //   popupEmailElem.classList.remove('invalid');
  // }
  if(!data.password){
    error = true;
    popupPasswordElem.classList.add('invalid');
    console.error('Invalid password');
  } else {
    popupPasswordElem.classList.remove('invalid');
  }
  if(error){
    buttonElem.style.display = 'none';
    buttonElem.style.animation = 'shake 0.4s linear';
    void buttonElem.offsetWidth;
    buttonElem.style.display = 'block';
    setTimeout(() => {buttonElem.style.animation = ''}, 400);
    return;
  }

  if(data.emoji && popupCheckboxElem.checked){
    let response = await fetch(`${apiBaseUrl}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(data),
    })

    if (response.ok) { 
      let content = await response.json();
      login(content.token, {
        username: data.username,
        emoji: data.emoji,
        // email: data.email,
      });
      popup('user', 'close');
      return;
    }
  }


  let response = await fetch(`${apiBaseUrl}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify(data),
  })
  
  if (response.ok) { 
    let content = await response.json();

    let response2 = await fetch(`${apiBaseUrl}/user`, {
      method: 'GET',
      headers: {
        Authorization: content.token,
        'Content-Type': 'application/json;charset=utf-8',
      },
    })
    let content2 = await response2.json();

    login(content.token, content2.data);

    popup('user', 'close');
  } else {
    error = true;
    popupEmojiElem.classList.add('invalid');
    popupCheckboxElem.classList.add('invalid');
    console.error('Unregistered user');
    buttonElem.style.display = 'none';
    buttonElem.style.animation = 'shake 0.4s linear';
    void buttonElem.offsetWidth;
    buttonElem.style.display = 'block';
    setTimeout(() => {buttonElem.style.animation = ''}, 400);
    return;
  }
}

async function sendUserLogoutForm(){
  let response = await fetch(`${apiBaseUrl}/user/logout`, {
    method: 'POST',
    headers: {
      Authorization: apiAuthToken,
      'Content-Type': 'application/json;charset=utf-8',
    },
  })
  
  if (response.ok) { 
    localStorage.removeItem('user');
    localStorage.removeItem('apiAuthToken');

    window.location = '/';
  } else {
    error = true;
    console.error('Cant logout');
    let buttonElem = document.getElementById('popup-user-send');
    buttonElem.style.display = 'none';
    buttonElem.style.animation = 'shake 0.4s linear';
    void buttonElem.offsetWidth;
    buttonElem.style.display = 'block';
    setTimeout(() => {buttonElem.style.animation = ''}, 400);
  }
}



function login(token, userData) {
  user = {
    username: '',
    emoji: '👤',
    solved: [],
    // email: '',
    finished: false,
    ...userData,
  };
  apiAuthToken = token;

  localStorage.setItem('apiAuthToken', apiAuthToken);
  localStorage.setItem('user', JSON.stringify(user));

  displayUser(user);
}


const popupElems = document.querySelectorAll('.popup');
popupElems.forEach(el => el.addEventListener('click', event => {
  if (event.target.classList.contains('popup')) {
    popup(event.target.dataset.popup, 'close');
  }
}));

function popup(popupId, action = 'toggle') {
  let popupElem = document.querySelector(`.popup[data-popup="${popupId}"]`);
  
  switch (action) {
    case 'open':
      popupElem.style.display = 'flex';
      break;
      case 'close':
        popupElem.classList.add('popup--hiden');
        setTimeout(() => {
          popupElem.style.display = 'none';
          popupElem.classList.remove('popup--hiden');
        }, 200);
        router.navigateTo(`/problem/${currentProblemNum}`);
      break;
    default:
    case 'toggle':
      if (popupElem.style.display === 'none') {
        popup(popupId, 'open');
      } else {
        popup(popupId, 'close');
      }
      break;
  }
}