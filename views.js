import inquirer from 'inquirer'
import Wallet from './wallet.js'
import { bitcoin } from './functions.js';

var ui = new inquirer.ui.BottomBar();

export function startView() {
    const options = [
        {
            type: 'list',
            name: 'authentication',
            message: `Welcome to Forward wallet`,
            choices: [
                {
                    key: 'login',
                    'name': 'Log In',
                    value: 'login'
                },
                {
                    key: 'recieve',
                    'name': 'Sign Up',
                    value: 'signup'
                },
                new inquirer.Separator('\n'),
                new inquirer.Separator(),
                'Get help'
            ]
        }
    ]
    
    inquirer
        .prompt(options)
        .then((answers) => {
            if (answers.authentication == 'login') {
                loginView()
            }
            else {
                signupView()
            }
        })
        .catch( (error) => {
            if (error.isTtyError) {
                console.log(`This app could not be opened in this terminal environment`)
            } else {
                console.log(`Something went wrong`)
            }
        })
}

function loginView() {
    const options = [
        {
            type: 'input',
            name: 'username',
            message: `Enter a username`,
            validate: function(value) {
                var done = this.async();
                Wallet.found(value, (found) => {
                    if (!found) {
                        done('username not found')
                        return
                    }

                    done(true)
                })
            }
        }
    ]
    
    inquirer
        .prompt(options)
        .then((answers) => {
            dashboardView(answers.username)
        })
        .catch( (error) => {
            console.log(error)
        })
}

function signupView() {
    const options = [
        {
            type: 'input',
            name: 'username',
            message: `Enter a username`,
            validate: function(value) {
                var done = this.async();
                Wallet.found(value, (found) => {
                    if (found) {
                        done('username not available')
                        return
                    }

                    done(true)
                })
            }
        }
    ]
    
    inquirer
        .prompt(options)
        .then((answers) => {

            Wallet.create(answers.username, (result) => {
                if (result.error) {
                    ui.log.write("Error creating wallet");
                    return
                }

                dashboardView(answers.username)
            })
        })
        .catch( (error) => {
            console.log(error)
        })
}

async function sendView(user) {
    const inputs = [
        {
            type: 'input',
            name: 'amount',
            message: `How much do you want to send?`,
            validate(value) {
                let invalid = isNaN(value)

                if (invalid) {
                    return 'Enter a valid amount to send'
                }

                return true
            }
        },
        {
            type: 'input',
            name: 'address',
            message: `What address do you want to send to?`,
        }
    ]


    await inquirer
    .prompt(inputs)
    .then( async (answers) => {
        let amount = bitcoin(answers.amount)
        let address = answers.address
       
        const send = await Wallet.send(amount, user, address)

        if (send.error) {
            ui.log.write('Error sending transaction')
            return
        }

        ui.log.write('Transaction sent' + amount)
    })
    .catch( (error) => {
        console.log(error)
    })
}

function dashboardView(user) {

    const options = [
        {
            type: 'list',
            name: 'wallet',
            message: `What do you want to do?`,
            choices: [
                {
                    key: 'send',
                    'name': 'Send bitcoin',
                    value: 'send'
                },
                {
                    key: 'recieve',
                    'name': 'Recieve bitcoin',
                    value: 'recieve'
                },
                {
                    key: 'balance',
                    'name': 'View wallet balance',
                    value: 'balance'
                },
                new inquirer.Separator('\n'),
                new inquirer.Separator(),
                'Exit',
            ]
        }
    ]

    inquirer
    .prompt(options)
    .then( (answers) => {
       
        if (answers.wallet == 'send') {
            sendView(user)
        }
        else if (answers.wallet == 'recieve') {
            Wallet.recieve(user, (result) => {
                if (result.error) {
                    ui.log.write("Could not retrieve wallet address. Address may not be found.");
                    return;
                }

                ui.log.write(`your payment address: ${result.row.address}`);
                return;
            })
        }
        else {
            Wallet.balance(user, (result) => {
                if (result.error) {
                    ui.log.write("Could not retrieve wallet balance. Address may not be found.");
                    return;
                }

                ui.log.write(`your balance: ${result.available_balance}`);
                ui.log.write(`your pending balance: ${result.pending_received_balance}`)
                return;
            })
        }
    })
    .catch( (error) => {

        console.log(error)
    })
}
