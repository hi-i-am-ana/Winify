if (stravaAuthSuccess === 'true') {
  $('.strava-auth-success-popup').addClass('display-block');
  $('.main-container').addClass('blurred');
};

const displayChallengeCard = (lastOrCurrent, period, type, singleOrTotal, roughCriteria) => {
  let criteria = roughCriteria;
  if( roughCriteria === 'speed') {
    if (type === 'run' || type === 'swim' || type==='walk') {
      criteria = 'average_pace'
    } else if (type === 'ride') {
      criteria = 'average_speed'
    }
  } else if (roughCriteria === 'time') {
    if (type === 'run' || type === 'ride' || type==='walk') {
      criteria = 'moving_time';
    } else if (type === 'swim') {
      criteria = 'elapsed_time';
    };
  };
  const cardContent = `
  <div class="challenge-card ${roughCriteria}-challenges-container">
    <h2>${singleOrTotal[0].toUpperCase()}${singleOrTotal.slice(1)} ${type[0].toUpperCase()}${type.slice(1)} ${(criteria[0].toUpperCase()+criteria.slice(1)).replace(/_/g,' ')}</h2>
    <div class="${roughCriteria}-${singleOrTotal}-winners-container">    
    </div>
    <button class="show-more-button" type="button">Show more</button>
  </div>
  `;
  $(`.${roughCriteria}-${singleOrTotal}-challenge-card`).html(cardContent);
  $.getJSON(`challenges/${lastOrCurrent}/${period}/${type}/${singleOrTotal}/${criteria}`)
  .then(response => {
    console.log(response);
    let camelCaseCriteria = criteria;
    switch (criteria) {
      case 'distance':
        camelCaseCriteria = 'distance';
        break;
      case 'moving_time':
        camelCaseCriteria = 'movingTime';
        break;
      case 'elapsed_time':
        camelCaseCriteria = 'elapsedTime';
        break;
      case 'average_pace':
        camelCaseCriteria = 'averagePace';
        break;
      case 'average_speed':
        camelCaseCriteria = 'averageSpeed';
        break;
      default:
        console.log('invalid criteria');
        break;
    };
    let winnersContainerContent = '';
    $.each(response, (index, winner) => {
      if (index <= 2) {
        winnersContainerContent += `
          <div class="winner-container">
            <i class="fas fa-medal medal-${index + 1}"></i>
            <div>${winner.firstname} ${winner.lastname} <span>${winner[camelCaseCriteria]}</span></div>
          </div>
        `;
      }
    });
    $(`.${roughCriteria}-${singleOrTotal}-winners-container`).html(winnersContainerContent);
  })
  .catch(error => {
    console.log(error.message);
  });
};

const displayCriteriaChallenges = (type, roughCriteria) => {
  console.log('displayCriteriaChallenges' + type + roughCriteria)
  displayChallengeCard(chosenLastOrCurrent, chosenPeriod, type, 'single', roughCriteria);
  displayChallengeCard(chosenLastOrCurrent, chosenPeriod, type, 'total', roughCriteria);
};

const activityTypes = ['run', 'ride', 'swim', 'walk', 'hike', 'wheelchair'];
const roughCriterias = ['distance', 'time', 'speed', 'elevation'];

let chosenType = 'run';
let chosenLastOrCurrent = 'current';
let chosenPeriod = 'week';

// TODO: Rewrite this with jQuery (each link will have id=type, eg id="run")
activityTypes.forEach(type => {
  $(`.${type}-nav-link`).click(event => {
    chosenType = type;
    let filteredRoughCriterias = roughCriterias;
    if (type === 'swim') {
      filteredRoughCriterias = roughCriterias.filter(item => item !== 'elevation');
    };
    filteredRoughCriterias.forEach(roughCriteria => {
      displayCriteriaChallenges(type, roughCriteria);
    });
  });
});

