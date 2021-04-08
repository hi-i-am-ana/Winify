if (stravaAuthSuccess === 'true') {
  $('.strava-auth-success-popup').addClass('display-block');
  $('.main-container').addClass('blurred');
};

const activityTypes = ['run', 'ride', 'swim', 'walk', 'hike', 'wheelchair'];
const roughCriterias = ['distance', 'time', 'speed', 'elevation'];

let chosenType = 'run';
let chosenCurrentOrLast = 'current';
let chosenPeriod = 'week';

$('.period-nav-link').click(e => {
  $('.period-nav-link').removeClass('clicked-period-nav-link')
  $(e.target).addClass('clicked-period-nav-link')
  const period = $(e.target).text().split(' ');
  chosenCurrentOrLast = period[0].toLowerCase();
  chosenPeriod = period[1].toLowerCase();
  displayChallenges();
})

const displayChallengeCard = (singleOrTotal, roughCriteria) => {
  let criteria = roughCriteria;
  if( roughCriteria === 'speed') {
    if (chosenType === 'run' || chosenType === 'swim' || chosenType === 'walk') {
      criteria = 'average_pace'
    } else if (chosenType === 'ride') {
      criteria = 'average_speed'
    }
  } else if (roughCriteria === 'time') {
    if (chosenType === 'run' || chosenType === 'ride' || chosenType === 'walk') {
      criteria = 'moving_time';
    } else if (chosenType === 'swim') {
      criteria = 'elapsed_time';
    };
  };
  // const challengeTitle = `${singleOrTotal[0].toUpperCase()}${singleOrTotal.slice(1)} ${type[0].toUpperCase()}${type.slice(1)} ${(criteria[0].toUpperCase()+criteria.slice(1)).replace(/_/g,' ')}`
  const challengeTitle = `${singleOrTotal.toUpperCase()} ${chosenType.toUpperCase()} ${criteria.toUpperCase().replace(/_/g,' ')}`
  const cardContent = `
    <div class="challenge-card ${roughCriteria}-${singleOrTotal}-challenge-card">
      <h2>${challengeTitle}</h2>
      <div class="winners-container ${roughCriteria}-${singleOrTotal}-winners-container">    
      </div>
      <button class="show-more-button ${roughCriteria}-${singleOrTotal}-show-more-button" type="button">Show more</button>
    </div>
  `;
  $(`.${roughCriteria}-challenges-container`).append(cardContent);
  $.getJSON(`challenges/${chosenCurrentOrLast}/${chosenPeriod}/${chosenType}/${singleOrTotal}/${criteria}`)
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
      case 'elevation':
        camelCaseCriteria = 'elevation';
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
            <i class="fas fa-award medal-${index + 1}"></i>
            <img class="winner-image" src="${winner.profilePictureUrl}">
              <div class="winner-name">${winner.firstname} ${winner.lastname}</div>
              <div class="winner-criteria-value">${winner[camelCaseCriteria]}</div>
          </div>
        `;
      };
    });
    $(`.${roughCriteria}-${singleOrTotal}-winners-container`).html(winnersContainerContent);
    // Add event listener for show more button to display full list of challenge partisipants
    $(`.${roughCriteria}-${singleOrTotal}-show-more-button`).click(event => {
      $('.side-info-title').text(challengeTitle);
      let sideInfoContent = '';
      console.log(response)
      $.each(response, (index, winner) => {
        if (index <= 2) {
          sideInfoContent += `
            <div class="winner-container">
              <i class="fas fa-award medal-${index + 1}"></i>
              <img class="winner-image" src="${winner.profilePictureUrl}">
                <div class="winner-name">${winner.firstname} ${winner.lastname}</div>
                <div class="winner-criteria-value">${winner[camelCaseCriteria]}</div>
            </div>
          `;
        } else {
          sideInfoContent += `
            <div class="winner-container">
              <div class="winner-number">${index + 1}</div>
              <img class="winner-image" src="${winner.profilePictureUrl}">
              <div class="winner-name">${winner.firstname} ${winner.lastname}</div>
              <div class="winner-criteria-value">${winner[camelCaseCriteria]}</div>
            </div>
          `;
        };
      });
      $('.side-info-content').html(sideInfoContent);
    });
  })
  .catch(error => {
    console.log(error.message);
  });
};

const displayCriteriaChallenges = (roughCriteria) => {
  displayChallengeCard('single', roughCriteria);
  displayChallengeCard('total', roughCriteria);
};

// TODO: Rewrite this with jQuery (each link will have id=type, eg id="run")
activityTypes.forEach(type => {
  $(`.${type}-nav-link`).click(event => {
    // TODO: Rewrite this with classes
    $('.side-nav-link-icon').css('background-color', '#ffff');
    $('.side-nav-link-icon :first-child').css('background-color', '#ffff');
    $('.side-nav-link-icon').css('color', '#444444');
    $('.side-nav-link-icon :first-child').css('color', '#444444');
    $('.side-nav-link-text').css('color', '#444444');
    $(`.${type}-nav-link :first-child`).css('background-color', '#a8aec5');
    $(`.${type}-nav-link :first-child`).css('color', '#e5bb3f');
    $(`.${type}-nav-link :last-child`).css('color', '#e5bb3f');

    chosenType = type;
    displayChallenges()
  });
});

const displayChallenges = () => {
  $(`.criteria-challenges-container`).empty();
  let filteredRoughCriterias = roughCriterias;
  if (chosenType === 'swim') {
    filteredRoughCriterias = roughCriterias.filter(item => item !== 'elevation');
  };
  filteredRoughCriterias.forEach(roughCriteria => {
    displayCriteriaChallenges(roughCriteria);
  });
};

// TODO: Remove this
$('.run-nav-link').click()

