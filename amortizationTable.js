import { LightningElement, api, wire, track } from 'lwc';
import getLoanDetails from '@salesforce/apex/AmortizationTable.getLoanDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    { label: 'Month', fieldName: 'month' },
    { label: 'Starting Balance', fieldName: 'startingbal' },
    { label: 'EMI', fieldName: 'emi' },
    { label: 'Interest Paid', fieldName: 'interestpaid' },
    { label: 'Principal Paid', fieldName: 'pricipalpaid' },
    { label: 'Ending Balance', fieldName: 'endingbal' },
];

export default class AmortizationTable extends LightningElement {
    @api recordId;

     P = '';
     R = '';
     N = '';

    showSchedule = false;
    data = [];
    columns = columns;

    wiredResult;

    @wire(getLoanDetails, { recordId: '$recordId' })
    wiredLoanDetails(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            this.P = data.principal;
            this.R = data.interest;
            this.N = data.duration;
        } else if (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error loading loan details',
                message: error.body.message,
                variant: 'error'
            }));
        }
    }

    refreshLoanDetails() {
        refreshApex(this.wiredResult);
        this.showSchedule = false;
    }

    handlePrincipal(event) {
        this.P = event.target.value;
    }

    handleInterestRate(event) {
        this.R = event.target.value;
    }

    handleDuration(event) {
        this.N = event.target.value;
    }

    handleCalculate() {
        const P = parseFloat(this.P);
        const annualRate = parseFloat(this.R);
        const N = parseInt(this.N, 10);

        if (!P || !annualRate || !N || P < 0 || annualRate < 0 || N < 0) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error Message',
                message: 'Enter valid values',
                variant: 'warning'
            }));
            return;
        }

        this.showSchedule = true;
        const r = annualRate / 12 / 100;
        const emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
        const roundedEMI = parseFloat(emi.toFixed(2));

        let schedule = [];
        let outstanding = P;

        for (let month = 1; month <= N; month++) {
            const interestPaid = parseFloat((outstanding * r).toFixed(2));
            const principalPaid = parseFloat((roundedEMI - interestPaid).toFixed(2));
            const endingBalance = parseFloat((outstanding - principalPaid).toFixed(2));

            schedule.push({
                month,
                startingbal: Math.round(outstanding),
                emi: Math.round(roundedEMI),
                interestpaid: Math.round(interestPaid),
                pricipalpaid: Math.round(principalPaid),
                endingbal: endingBalance < 0 ? 0 : Math.round(endingBalance),
            });

            outstanding = endingBalance;
        }

        this.data = schedule;
    }

    handleReset() {
        this.P = '';
        this.R = '';
        this.N = '';
        this.data = [];
        this.showSchedule = false;
    }
}
