function generateSchedule(Techs, OneToOnesGendered, OneToOnesRegular, jobStartOffset, breakStartOffset, ) {
    // Define the job options
    const breakString = "Break"
    const defaultString = "Support";
    const firstBreak = 3;
    const lastBreak = 6;
    const totalHours = 7;
    console.log("offset: " + breakStartOffset);

    let errorString = "";
    let success = true;
    

    // Initialize the 2D array for the schedule
    let schedule = Array.from(Array(Techs), () => new Array(totalHours));
    for (let t = 0; t < Techs; t++){
      for (let h = 0; h < totalHours; h++){
        schedule[t][h] = defaultString;
      }
    }

    if (jobStartOffset == Techs){
        console.log("It cannot be done");
        return schedule;
    }

    // Pass 1, Fill in the breaks
    // Overlap breaks occur when we have more techs than break slots
    let breakHours = lastBreak - firstBreak ;
    for (let tech = 0; tech < Techs; tech++) {
      schedule[((tech + breakStartOffset) % Techs)][firstBreak + (tech % breakHours)] = breakString;
    }

      // Pass 2, Assign Gendered 1:1
      let assignedGTechs = new Array(Techs);
      let startTech = 0;
      for (let g = 0; g < OneToOnesGendered; g++){
        // Get pairs of people who are not on the same break
        // Currenlty that's adjacent techs
        // Set the title of the job to be paired
        let job = "1:1 (g" + (g + 1) + ")";
        // Find their break
        
        for (let t1 = 0; t1 < Techs; t1++){
            let breakI1 = -1;
            let breakI2 = -1;
            let partnerT1 = -1;
            if (!assignedGTechs.includes(t1)){
                // Find break for T1
                for (let h = 0; h < totalHours; h++){
                    if (schedule[t1][h] === breakString){
                        breakI1 = h;
                        break;
                    } 
                }
                
                for (let t2 = t1 + 1; t2 < Techs; t2++){
                    if(!assignedGTechs.includes(t2)){
                        // Find Break for T2
                        for (let h = 0; h < totalHours; h++){
                            // If one has odd break and the other is even, they can be partners
                            if (schedule[t2][h] === breakString && ((h + breakI1) % 2) == 1){
                                breakI2 = h;
                                partnerT1 = t2;
                                break;
                            }
                        }
                    }
                }
            }
            if (breakI1 !== -1 && breakI2 !== -1 && partnerT1 !== -1){
                // Assuming they are valid partners, find the one with the odd Break, they start at time 0 with the 1:1
                let firstTech;
                let secondTech;
                if (breakI1 % 2 == 1){
                    // If the first one is odd, it goes first
                    firstTech = t1;
                    secondTech = partnerT1;
                } else {
                    firstTech = partnerT1;
                    secondTech = t1;
                }
                for (let h = 0; h < totalHours; h++){
                    if (h % 2 == 0) {
                        schedule[firstTech][h] = job;
                    } else {
                        schedule[secondTech][h] = job;
                    }
                }
                assignedGTechs.push(firstTech);
                assignedGTechs.push(secondTech);
                break;
            }
        }
        
      }

      // Pass 4, assign Rounder and Clinical and 1:1s
      const jobs = ["Rounder", "Clinical"]
      for (let r = 0; r < OneToOnesRegular; r++){
        jobs.unshift("1:1 (" + (r + 1) + ")")
      }
      for (let j = 0; j < jobs.length; j++){
        let job = jobs[j];
        let offset = jobStartOffset;
        for (let hour = 0; hour < totalHours; hour++){
            let jobAssigned = false;
            for (let t = 0; t < Techs; t++){
              tech = (t + offset) % Techs
                if (schedule[tech][hour] === defaultString){
                  let prevHourValid = true;
                  let postHourValid = true;
                    // Check if this job was assigned previously
                    if (hour > 0) {
                      prevHourValid = schedule[tech][hour - 1].slice(0,3) !== job.slice(0,3)
                    }
                    if (hour < totalHours - 1){
                      postHourValid = schedule[tech][hour + 1].slice(0,3) !== job.slice(0,3);
                    }
                    if (prevHourValid && postHourValid){
                        schedule[tech][hour] = job;
                        jobAssigned = true;
                        break;
                    } 
                }
            }
            offset += 1;
            if (!jobAssigned) {
                success = false;
                errorString += (job + " not assigned at hour " + hour + "\n");
            }
        }
      }
      
      console.log(errorString);
      if (!success){
        console.log("It's broken!");
        schedule = Array.from(Array(Techs), () => new Array(totalHours));
        for (let t = 0; t < Techs; t++){
            for (let h = 0; h < totalHours; h++){
                schedule[t][h] = "Not Possible";
         }
    }
      }
    return schedule;
  }
  
// TODO: Print button

  // Example usage:
  const Techs = 4;
  const OneToOnesGendered = 0;
  const OneToOnesRegular = 1;
  const jobOffset = 0;
  const breakoffset = 0;
  
  const result = generateSchedule(Techs, OneToOnesGendered, OneToOnesRegular, jobOffset, breakoffset);
  console.log(result);
  console.log("ran it");
  