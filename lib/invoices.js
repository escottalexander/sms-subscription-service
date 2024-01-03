import entityModel from "../model/entities";
import reportingModel from "../model/reporting";
import stateModel from "../model/state";
import PDFDocument from  "pdfkit";

const invoiceGenerator = {
    generateForAll: async ({ startDate, endDate }) => {
        const invoices = [];
        const entities = await entityModel.getAll();
        for (let entity of entities) {
            const invoice = await invoiceGenerator.generateForEntity({ entity, startDate, endDate });
        }
    },
    generateForEntity: async ({ entity, startDate, endDate }) => {
        const data = await reportingModel.aggregateByDateRange({ entityId: entity.entityId, startDate, endDate });
        let total = 0;
        if (data.length) {
            const { totalSentCount, totalResponseCount } = data[0];
            total = totalSentCount + totalResponseCount;
        }
        const serviceFee = await stateModel.getSetting("serviceFee") || 0;
        const invoice = invoiceGenerator.buildInvoice({ total, serviceFee, entity });
        return invoice;
    },
    buildInvoice: (data) => {
        const { total, serviceFee, entity } = data;
        const doc = new PDFDocument;

    }
}