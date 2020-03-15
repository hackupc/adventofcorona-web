var currentProblemId = 0;
var problems = localStorage.getItem('problems');
var progress = localStorage.getItem('progress');
Promise.all([
  fetch('data/problems.json')
    .then(response => response.json())
    .then(content => {
      problems = content;
      localStorage.setItem('problems', problems);
    }),
  fetch('data/progress.json')
    .then(response => response.json())
    .then(content => {
      progress = content;
      localStorage.setItem('progress', progress);
    }),
]).then((values => {
  router.navigateTo(`/problem/${currentProblemId}`);
}));
const problemTitleElem = document.getElementById('problem-title');
const problemStatementElem = document.getElementById('problem-statement');
const answerInputElem = document.getElementById('answer-imput');
const feedbackElem = {
  true: document.getElementById('feedback-true'),
  false: document.getElementById('feedback-false'),
  undefined: document.getElementById('feedback-undefined'),
}
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
  router.navigateTo('/help');
});

router.add('/help', () => {
  
});

router.add('/login', () => {
  
});

router.add('/problem/(:num)', displayProblem);

router.add('about', () => {
  console.log('About Page');
});

router.addUriListener();

function displayProblem(problemId) {
  currentProblemId = problemId;
  answerInputElem.textContent = progress.problems.lastAcceptedAnswer[currentProblemId] || '';
  problemTitleElem.textContent = problems[currentProblemId].title;
  problemStatementElem.textContent = problems[currentProblemId].statement;
  feedbackElem.true.style.display = 'none';
  feedbackElem.false.style.display = 'none';
  feedbackElem.undefined.style.display = 'none';
  let elem = document.querySelector('.nav--problems > .active').classList.remove('active');
  document.querySelector(`.nav--problems > [data-id='${currentProblemId}']`).classList.add('active');
}

// TODO: Fill problem list