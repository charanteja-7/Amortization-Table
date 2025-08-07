import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columns = [
    { label: 'Month', fieldName: 'month' },
    { label: 'Starting Balance', fieldName: 'startingbal'},
    { label: 'EMI', fieldName: 'emi'},
    { label: 'Interest Paid', fieldName: 'interestpaid' },
    { label: 'Pricipal Paid', fieldName: 'pricipalpaid'},
    { label: 'Ending Balance', fieldName: 'endingbal'},
];

export default class AmortizationTable extends LightningElement {
    P; //principal amount
    R; //Interest Rate
    N; //Duration
    showSchedule = false;
    data = [];
    columns = columns;

    handlePrincipal(event){
       this.P = event.target.value;
    }
    handleInterestRate(event){
       this.R = event.target.value;
    }
    handleDuration(event){
        this.N = event.target.value;
    }
    
    handleCalculate() {
    const P = parseFloat(this.P);
    const annualRate = parseFloat(this.R);
    const N = parseInt(this.N, 10);

    if (!P || !annualRate || !N || P<0 || annualRate < 0 || N < 0) {
        const event = new ShowToastEvent({
            title: 'Error Message',
            message:'Enter valid values',
            variant : 'warning'
        });
        this.dispatchEvent(event);
        return
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
            endingbal: endingBalance <0?0:Math.round(endingBalance),
        });

        outstanding = endingBalance;
    }

    this.data = schedule;
}



    //reset data
    handleReset(){
        this.P = '';
        this.R = '';
        this.N ='';
        this.data = [];
        this.showSchedule= false;
    }
}
