function generateSchedule(Techs, OneToOnesGendered, OneToOnesRegular, jobStartOffset, breakStartOffset, coverageBool) {
  // Define the job options
  const breakString = "Break";
  const lastBreakString = "Break/Support";
  const defaultString = "Support";
  const coverageDefaultString = "";
  const firstBreak = 3;
  const lastBreak = 6;
  const totalHours = 7;
  const jobs = ["Rounder", "Clinical"];
  const maxCoverage = 5; // Num of coverage spots allowed
  // covBool = true;




  let errorString = "";
  let success = true;


  // Initialize the 2D array for the schedule
  let schedule = Array.from(Array(Techs), () => new Array(totalHours));
  for (let t = 0; t < Techs; t++) {
    for (let h = 0; h < totalHours; h++) {
      schedule[t][h] = defaultString;
    }
  };

  // TODO: Setup coverage. If @coverageBool == True, Assign job if coverage bool hasn't been used. 
  // Initialize Coverage Array
  let coverageArray = Array.from(Array(maxCoverage), () => new Array(totalHours));
  for (let t = 0; t < maxCoverage; t++) {
    for (let h = 0; h < totalHours; h++) {
      coverageArray[t][h] = coverageDefaultString;
    }
  };


  // Pass 1, Fill in the breaks
  // Overlap breaks occur when we have more techs than break slots
  let breakHours = lastBreak - firstBreak;
  // Insert +1 break hour when > 4 techs. 
  if (Techs >= 5){
      breakHours = lastBreak - firstBreak + 1;
  } 

  
  for (let tech = 0; tech < Techs; tech++) {
    if (tech == Techs - 1) {
        schedule[((tech + breakStartOffset) % Techs)][firstBreak + (tech % breakHours)] = lastBreakString;
    } else {
        schedule[((tech + breakStartOffset) % Techs)][firstBreak + (tech % breakHours)] = breakString;
    }
  }

  // Pass 2, Assign Gendered 1:1
  let assignedGTechs = new Array(Techs);
  let startTech = 0;
  for (let g = 0; g < OneToOnesGendered; g++) {
    // Get pairs of people who are not on the same break
    // Currenlty that's adjacent techs
    // Set the title of the job to be paired
    let job = "1:1 (g" + (g + 1) + ")";
    // Find their break
    let assignedGJob = false;


    for (let t1 = 0; t1 < Techs; t1++) {
      let breakI1 = -1;
      let breakI2 = -1;
      let partnerT1 = -1;
      if (!assignedGTechs.includes(t1)) {
        // Find break for T1
        for (let h = 0; h < totalHours; h++) {
          if (schedule[t1][h] === breakString) {
            breakI1 = h;
            break;
          }
        }

        for (let t2 = t1 + 1; t2 < Techs; t2++) {
          if (!assignedGTechs.includes(t2)) {
            // Find Break for T2
            for (let h = 0; h < totalHours; h++) {
              // If one has odd break and the other is even, they can be partners
              if (schedule[t2][h] === breakString && ((h + breakI1) % 2) == 1) {
                breakI2 = h;
                partnerT1 = t2;
                break;
              }
            }
          }
        }
      }
      if (breakI1 !== -1 && breakI2 !== -1 && partnerT1 !== -1) {
        // Assuming they are valid partners, find the one with the odd Break, they start at time 0 with the 1:1
        let firstTech;
        let secondTech;
        if (breakI1 % 2 == 1) {
          // If the first one is odd, it goes first
          firstTech = t1;
          secondTech = partnerT1;
        } else {
          firstTech = partnerT1;
          secondTech = t1;
        }
        for (let h = 0; h < totalHours; h++) {
          if (h % 2 == 0) {
            schedule[firstTech][h] = job;
          } else {
            schedule[secondTech][h] = job;
          }
        }
        assignedGTechs.push(firstTech);
        assignedGTechs.push(secondTech);
        assignedGJob = true;
        break;
      }
    }
    if (!assignedGJob){
      success = false;
      console.log("unable to assign: " + job);
    }
  }

  var coverageInd = 0; // Variable updated as we fill in coverage spots. 
  var maxCoverageInd = -1; // Var to keep track of # of coverage used (for pruning later)

  // Pass 4, due to issues with coverage scheduling, do the 1:1s first.
  let OneToOneJobs = [];
  for (let r = 0; r < OneToOnesRegular; r++) {
    OneToOneJobs.push("1:1 (" + (r + 1) + ")")
  }
  for (let j = 0; j < OneToOneJobs.length; j++) {
    let job = OneToOneJobs[j];
    let offset = jobStartOffset;
    for (let hour = 0; hour < totalHours; hour++) {
      let jobAssigned = false;
      for (let t = 0; t < Techs; t++) {
        tech = (t + offset) % Techs
        if (schedule[tech][hour] === defaultString) {
          let prevHourValid = true;
          let postHourValid = true;
          // Check if this job was assigned previously
          if (hour > 0) {
            prevHourValid = schedule[tech][hour - 1].slice(0, 3) !== job.slice(0, 3)
          }
          if (hour < totalHours - 1) {
            postHourValid = schedule[tech][hour + 1].slice(0, 3) !== job.slice(0, 3);
          }
          if (prevHourValid && postHourValid) {
            schedule[tech][hour] = job;
            jobAssigned = true;
            break;
          }
        }
      }
      offset += 1;
      if (!jobAssigned) {
        if (coverageBool) {
          console.log(" Entered Coverage assignment");
          coverageInd = -1;
          for (let c = 0; c < maxCoverage; c++) {
            if (coverageArray[c][hour] == coverageDefaultString) {
              coverageInd = c;
              break;
            }
          }
          console.log("Coverage Ind: " + coverageInd);

          if (coverageInd != -1) {
            coverageArray[coverageInd][hour] = job;
            jobAssigned = true;
            if (coverageInd > maxCoverageInd) maxCoverageInd = coverageInd;
          }

        } else {
          success = false;
          errorString += (job + " not assigned at hour " + hour + "\n");
        }
      }
    }
  }
  // Pass 5, assign Rounder and Clinical


  for (let j = 0; j < jobs.length; j++) {
    let job = jobs[j];
    let offset = jobStartOffset;
    for (let hour = 0; hour < totalHours; hour++) {
      let jobAssigned = false;
      for (let t = 0; t < Techs; t++) {
        tech = (t + offset) % Techs
        if (schedule[tech][hour] === defaultString) {
          let prevHourValid = true;
          let postHourValid = true;
          // Check if this job was assigned previously
          if (hour > 0) {
            prevHourValid = schedule[tech][hour - 1].slice(0, 3) !== job.slice(0, 3)
          }
          if (hour < totalHours - 1) {
            postHourValid = schedule[tech][hour + 1].slice(0, 3) !== job.slice(0, 3);
          }
          if (prevHourValid && postHourValid) {
            schedule[tech][hour] = job;
            jobAssigned = true;
            break;
          }
        }
      }
      offset += 1;
      if (!jobAssigned) {
        if (coverageBool) {
          coverageInd = -1;
          for (let c = 0; c < maxCoverage; c++) {
            if (coverageArray[c][hour] == coverageDefaultString) {
              coverageInd = c;
              break;
            }
          }
          if (coverageInd != -1) {
            coverageArray[coverageInd][hour] = job;
            jobAssigned = true;
            if (coverageInd > maxCoverageInd) maxCoverageInd = coverageInd;
          }
          else {
            success = false;
          errorString += (job + " not assigned at hour " + hour + "\n");
          }

        } else {
          success = false;
          errorString += (job + " not assigned at hour " + hour + "\n");
        }
      }
    }
  }

  console.log(errorString);
  if (!success) {
    console.log("It's broken!");
    schedule = Array.from(Array(Techs), () => new Array(totalHours));
    for (let t = 0; t < Techs; t++) {
      for (let h = 0; h < totalHours; h++) {
        schedule[t][h] = "Not Possible";
      }
    } 
    return schedule;
  }
  let finalCovArray = coverageArray.slice(0, maxCoverageInd + 1);
  let combinedSched = schedule.concat(finalCovArray);
  return combinedSched;
}

// TODO: Print button

// Example usage:
const Techs = 4;
const OneToOnesGendered = 0;
const OneToOnesRegular = 1;
const jobOffset = 0;
const breakoffset = 0;

const result = generateSchedule(Techs, OneToOnesGendered, OneToOnesRegular, jobOffset, breakoffset, true);
