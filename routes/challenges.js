const express = require('express');
const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const router = express.Router();
const prisma = new PrismaClient();

// Declare function to determine challenge winners for total activities
const determineResultsTotal = (res, periodStart, periodEnd, type, criteria) => {
  let sum = {};
  if (criteria === 'averagePace') {
    sum = {
      distance: true,
      movingTime: true
    }
  } else {
    sum = {
      [criteria]: true
    }
  };
  prisma.activity.groupBy({
    by: ['stravaUserId'],
    where: {
      type: type,
      startDateLocal: {
        // gte: periodStart,
        // TODO: Change this for current week and month after implementing webhooks
        // lte: periodEnd
      }
    },
    sum: sum
  })
  .then(results => {
    if (criteria === 'averagePace') {
      results.forEach(result => {
        // Calculate pace in sec/m
        result.averagePace = result.sum.movingTime / result.sum.distance;
        // Sort results by pace in ascending order
        results.sort((a, b) => a.averagePace - b.averagePace);
      });
    } else {
      results.forEach(result => {
        // Transfer criteria sum one level up
        result[criteria] = result.sum[criteria];
      });
      // Sort results by criteria in descending order
      results.sort((a, b) => b[criteria] - a[criteria]);
    };
    results.forEach(result => {
      delete result.sum;
    });
    // Convert criteria value units for display
    convertUnits(results, type, criteria);
    // Add user data (firstname, lastname and profile picture) to results
    addUserData(results, res);
  });
};

// Declare function to determine challenge winners for single activity
const determineResultsSingle = (res, periodStart, periodEnd, type, criteria) => {
  let select = {};
  let orderBy = {};
  if (criteria === 'averagePace') {
    select = {
      stravaUserId: true,
      distance: true,
      movingTime: true,
      user: {
        select: {
          firstname: true,
          lastname: true,
          profilePictureUrl: true
        }
      }
    };
  } else {
    select = {
      stravaUserId: true,
      [criteria]: true,
      user: {
        select: {
          firstname: true,
          lastname: true,
          profilePictureUrl: true
        }
      }
    };
    orderBy = {
      [criteria]: 'desc'
    };
  }
  prisma.activity.findMany({
    where: {
      type: type,
      startDateLocal: {
        // gte: periodStart,
        // TODO: Change this for current week and month after implementing webhooks
        // lte: periodEnd
      }
    },
    select: select,
    orderBy: orderBy
  })
  .then(selectedActivities => {
    if (criteria === 'averagePace') {
      selectedActivities.forEach(activity => {
        // Calculate pace in sec/m
        activity.averagePace = activity.movingTime / activity.distance;
      });
      // Sort activities by pace in ascending order
      selectedActivities.sort((a, b) => a.averagePace - b.averagePace);
    };
    // Delete users duplicates from sorted activities - each user will have one best activity (by requested criteria)
    let activities = [];
    selectedActivities.forEach(selectedActivity => {
      if (!activities.some(activity => activity.stravaUserId === selectedActivity.stravaUserId)) {
        activities.push(selectedActivity)
      };
    });
    // Transfer user data one level up
    activities.forEach(activity => {
      activity.lastname = activity.user.lastname;
      activity.firstname = activity.user.firstname;
      activity.profilePictureUrl = activity.user.profilePictureUrl;
      delete activity.user;
    })
    // Convert criteria value units for display
    convertUnits(activities, criteria);
    // Convert bigint (stravaUserId) into number
    activities.forEach(activity => {
      activity.stravaUserId = Number(activity.stravaUserId);
    });
    res.json(activities);
  });
};

// Declare function for converting criteria value units
const convertUnits = (activities, type, criteria) => {
  if (criteria === 'distance') {
    activities.forEach(activity => {
      if (activity.distance >= 1000) {
        // Convert distance from m to km
        activity.distance = `${(activity.distance / 1000).toFixed(2)}km`;
      } else {
        activity.distance = `${(activity.distance).toFixed(0)}m`;
      };
    });
  } else if (criteria === 'movingTime' || criteria === 'elapsedTime') {
    activities.forEach(activity => {
      // Convert time from sec to h&min or min&sec
      let minutes = Math.floor(activity[criteria] / 60);
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        minutes = minutes - hours * 60;
        if (minutes !== 0) {
          activity[criteria] = `${hours}h ${minutes}m`;
        } else {
          activity[criteria] = `${hours}h`;
        };
      } else {
        const seconds = activity[criteria] - minutes * 60;
        if (seconds !== 0) {
          activity[criteria] = `${minutes}m ${seconds}s`;
        } else {
          activity[criteria] = `${minutes}m`;
        };
      };
    });
  } else if (criteria === 'elevation') {
    activities.forEach(activity => {
      activity.elevation = `${activity.elevation.toFixed(0)}m`;
    });
  } else if (criteria === 'averageSpeed') {
    activities.forEach(activity => {
      // Convert speed from m/sec to km/h
      activity.averageSpeed = `${(activity.averageSpeed * 60 * 60 / 1000).toFixed(1)}km/h`;
    });
  } else if (criteria === 'averagePace') {
    activities.forEach(activity => {
      if (type === 'Run') {
        // Convert pace from sec/m to min/km
        const paceQuotient = Math.floor(activity.averagePace * 1000 / 60);
        const paceRemainder = Math.round(activity.averagePace * 1000 % 60);
        activity.averagePace = `${paceQuotient}:${paceRemainder}/km`;
      } else if (type === 'Swim') {
        // Convert pace from sec/m to min/100m
        const paceQuotient = Math.floor(activity.averagePace * 100 / 60);
        const paceRemainder = Math.round(activity.averagePace * 100 % 60);
        activity.averagePace = `${paceQuotient}:${paceRemainder}/100m`;
      };
    });
  };
};

// Declare function for adding user data (firstname, lastname and profile picture) to results
const addUserData = (results, res) => {
  // Create array of database queries
  const arrayOfSelects = [];
  results.forEach((result, index) => {
    const select =
      prisma.user.findUnique({
        where: {
          stravaUserId: result.stravaUserId
        },
        select: {
          lastname: true,
          firstname: true,
          profilePictureUrl: true
        }
      })
    arrayOfSelects.push(select)
  });
  // Perform queries from array of database queries to get users firstname, lastename and picture
  Promise.all(arrayOfSelects)
  .then((arrayOfUsers) => {
    arrayOfUsers.forEach((user, index) => {
      results[index].lastname = user.lastname;
      results[index].firstname = user.firstname;
      results[index].profilePictureUrl = user.profilePictureUrl;
    });
    // Convert bigint (stravaUserId) into number
    results.forEach(result => {
      result.stravaUserId = Number(result.stravaUserId);
    });
    res.json(results);
  })
  .catch(error => {
    res.json({ error: error.message });
  });
};

// Declare functions to determine challenge period start and end
const currentMonthStart = () => {
  const time = moment().startOf('month').format();
  return time;
};
const currentWeekStart = () => {
  const time = moment().startOf('week').format();
  return time;
};
const endOfYesterday = () => {
  const time = moment().subtract(1, 'days').endOf('day').format();
  return time;
};
const lastWeekStart = () => {
  const time = moment().subtract(1, 'week').startOf('week').format();
  return time;
};
const lastWeekEnd = () => {
  const time = moment().subtract(1, 'week').endOf('week').format();
  return time;
};
const lastMonthStart = () => {
  const time = moment().subtract(1, 'month').startOf('month').format();
  return time;
};
const lastMonthEnd = () => {
  const time = moment().subtract(1, 'month').endOf('month').format();
  return time;
};

// CURRENT WEEK / RUN / SINGLE

router.get('/current/week/run/single/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/current/week/run/single/moving_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/current/week/run/single/elevation', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/current/week/run/single/average_pace', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// CURRENT WEEK / RIDE / SINGLE

router.get('/current/week/ride/single/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/current/week/ride/single/moving_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/current/week/ride/single/elevation', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/current/week/ride/single/average_speed', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// CURRENT WEEK / WALK / SINGLE

router.get('/current/week/walk/single/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/current/week/walk/single/moving_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/current/week/walk/single/elevation', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/current/week/walk/single/average_pace', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// CURRENT WEEK / SWIM / SINGLE

router.get('/current/week/swim/single/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/current/week/swim/single/elapsed_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/current/week/swim/single/average_pace', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

// CURRENT MONTH / RUN / SINGLE

router.get('/current/month/run/single/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/current/month/run/single/moving_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/current/month/run/single/elevation', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/current/month/run/single/average_pace', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// CURRENT MONTH / RIDE / SINGLE

router.get('/current/month/ride/single/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/current/month/ride/single/moving_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/current/month/ride/single/elevation', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/current/month/ride/single/average_speed', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// CURRENT MONTH / WALK / SINGLE

router.get('/current/month/walk/single/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/current/month/walk/single/moving_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/current/month/walk/single/elevation', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/current/month/walk/single/average_pace', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// CURRENT MONTH / SWIM / SINGLE

router.get('/current/month/swim/single/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/current/month/swim/single/elapsed_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/current/month/swim/single/average_pace', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

// LAST WEEK / RUN / SINGLE

router.get('/last/week/run/single/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/last/week/run/single/moving_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/last/week/run/single/elevation', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/last/week/run/single/average_pace', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// LAST WEEK / RIDE / SINGLE

router.get('/last/week/ride/single/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/last/week/ride/single/moving_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/last/week/ride/single/elevation', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/last/week/ride/single/average_speed', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// LAST WEEK / WALK / SINGLE

router.get('/last/week/walk/single/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/last/week/walk/single/moving_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/last/week/walk/single/elevation', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/last/week/walk/single/average_pace', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// LAST WEEK / SWIM / SINGLE

router.get('/last/week/swim/single/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/last/week/swim/single/elapsed_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/last/week/swim/single/average_pace', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

// LAST MONTH / RUN / SINGLE

router.get('/last/month/run/single/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/last/month/run/single/moving_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/last/month/run/single/elevation', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/last/month/run/single/average_pace', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// LAST MONTH / RIDE / SINGLE

router.get('/last/month/ride/single/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/last/month/ride/single/moving_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/last/month/ride/single/elevation', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/last/month/ride/single/average_speed', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// LAST MONTH / WALK / SINGLE

router.get('/last/month/walk/single/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/last/month/walk/single/moving_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/last/month/walk/single/elevation', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/last/month/walk/single/average_pace', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// LAST MONTH / SWIM / SINGLE

router.get('/last/month/swim/single/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/last/month/swim/single/elapsed_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/last/month/swim/single/average_pace', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsSingle(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

// CURRENT WEEK / RUN / TOTAL

router.get('/current/week/run/total/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/current/week/run/total/moving_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/current/week/run/total/elevation', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/current/week/run/total/average_pace', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// CURRENT WEEK / RIDE / TOTAL

router.get('/current/week/ride/total/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/current/week/ride/total/moving_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/current/week/ride/total/elevation', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/current/week/ride/total/average_speed', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// CURRENT WEEK / WALK / TOTAL

router.get('/current/week/walk/total/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/current/week/walk/total/moving_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/current/week/walk/total/elevation', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/current/week/walk/total/average_pace', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// CURRENT WEEK / SWIM / TOTAL

router.get('/current/week/swim/total/distance', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/current/week/swim/total/elapsed_time', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/current/week/swim/total/average_pace', (req, res) => {
  const periodStart = currentWeekStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

// CURRENT MONTH / RUN / TOTAL

router.get('/current/month/run/total/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/current/month/run/total/moving_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/current/month/run/total/elevation', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/current/month/run/total/average_pace', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// CURRENT MONTH / RIDE / TOTAL

router.get('/current/month/ride/total/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/current/month/ride/total/moving_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/current/month/ride/total/elevation', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/current/month/ride/total/average_speed', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// CURRENT MONTH / WALK / TOTAL

router.get('/current/month/walk/total/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/current/month/walk/total/moving_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/current/month/walk/total/elevation', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/current/month/walk/total/average_pace', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// CURRENT MONTH / SWIM / TOTAL

router.get('/current/month/swim/total/distance', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/current/month/swim/total/elapsed_time', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/current/month/swim/total/average_pace', (req, res) => {
  const periodStart = currentMonthStart();
  const periodEnd = endOfYesterday();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

// LAST WEEK / RUN / TOTAL

router.get('/last/week/run/total/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/last/week/run/total/moving_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/last/week/run/total/elevation', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/last/week/run/total/average_pace', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// LAST WEEK / RIDE / TOTAL

router.get('/last/week/ride/total/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/last/week/ride/total/moving_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/last/week/ride/total/elevation', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/last/week/ride/totalaverage_speed', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// LAST WEEK / WALK / TOTAL

router.get('/last/week/walk/total/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/last/week/walk/total/moving_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/last/week/walk/total/elevation', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/last/week/walk/total/average_pace', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// LAST WEEK / SWIM / TOTAL

router.get('/last/week/swim/total/distance', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/last/week/swim/total/elapsed_time', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/last/week/swim/total/average_pace', (req, res) => {
  const periodStart = lastWeekStart();
  const periodEnd = lastWeekEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

// LAST MONTH / RUN / TOTAL

router.get('/last/month/run/total/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'distance');
});

router.get('/last/month/run/total/moving_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'movingTime');
});

router.get('/last/month/run/total/elevation', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'elevation');
});

router.get('/last/month/run/total/average_pace', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Run', 'averagePace');
});

// LAST MONTH / RIDE / TOTAL

router.get('/last/month/ride/total/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'distance');
});

router.get('/last/month/ride/total/moving_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'movingTime');
});

router.get('/last/month/ride/total/elevation', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'elevation');
});

router.get('/last/month/ride/total/average_speed', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Ride', 'averageSpeed');
});

// LAST MONTH / WALK / TOTAL

router.get('/last/month/walk/total/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'distance');
});

router.get('/last/month/walk/total/moving_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'movingTime');
});

router.get('/last/month/walk/total/elevation', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'elevation');
});

router.get('/last/month/walk/total/average_pace', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Walk', 'averagePace');
});

// LAST MONTH / SWIM / TOTAL

router.get('/last/month/swim/total/distance', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'distance');
});

router.get('/last/month/swim/total/elapsed_time', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'elapsedTime');
});

router.get('/last/month/swim/total/average_pace', (req, res) => {
  const periodStart = lastMonthStart();
  const periodEnd = lastMonthEnd();
  determineResultsTotal(res, periodStart, periodEnd, 'Swim', 'averagePace');
});

module.exports = router;