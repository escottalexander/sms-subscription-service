import cron from 'node-cron';
import logger from './logger.js';

const taskScheduler = {
    init: () => {
        for (let task of taskScheduler.tasks) {
            logger.info('');
            cron.schedule(task.schedule, task.func, {
                timezone: "America/New_York"
            });
        }
    },
    tasks: [
        {
            name: "Weekly Entity Report",
            schedule: "0 8 * * 1",
            func: () => { 
                logger.info("Running task: Weekly Entity Report");
            }
        },
        {
            name: "Monthly Invoices",
            schedule: "5 8 1 * *",
            func: () => {
                logger.info("Running task: Monthly Invoices");
            }
        },
        {
            name: "Test Task",
            schedule: "* * * * *",
            func: () => { console.log("Running test task") }
        },
    ]
}

export default taskScheduler;