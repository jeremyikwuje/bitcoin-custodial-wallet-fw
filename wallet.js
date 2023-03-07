import dotenv from 'dotenv'
import BlockIo from 'block_io'
import sqlite3 from "sqlite3";

dotenv.config();

export default class Wallet
{
    static async send(amount, from_label, to_addresses) {
        /** prepare transaction */
        const block_io = new BlockIo(
            process.env.BLOCK_IO_KEY,
            process.env.BLOCK_IO_PIN
        )
    
        try {
            // Withdraw to our new address
            // get the data to create the transaction
            let prepared_transaction = await block_io.prepare_transaction({
                from_labels: from_label,
                to_addresses: to_addresses,
                amount: `${amount}`
            });

            // summarize the transaction we are going to prepare
            // for in-depth review, look at prepared_transaction yourself
            let summarized_transaction = await block_io.summarize_prepared_transaction({data: prepared_transaction});
            console.log(JSON.stringify(summarized_transaction, null, 2));

            // after review, if you wish to approve the transaction: create and sign it
            let signed_transaction = await block_io.create_and_sign_transaction({data: prepared_transaction});
            console.log(JSON.stringify(signed_transaction,null,2));
            
            // review the signed transaction (specifically, the tx_hex) and ensure things are as you want them
            // if you approve of it, submit the transaction for Block.io's signatures and broadcast to the blockchain network
            // if successful, the data below contains the transaction ID on the blockchain network
            let data = await block_io.submit_transaction({transaction_data: signed_transaction});
            console.log(JSON.stringify(data, null, 2));

            return data
        }
        catch(err) {
            console.log(err)
            return {
                error: err
            }
        }
    }
    
    static async recieve(user_label, result) {
        const db = new sqlite3.Database('wallet.db');
    
        /** retrieve wallet info **/
        let sql = `SELECT * FROM wallet WHERE user_label='${user_label}'`
        db.get(sql, async (err, row) => {
            if (err) return result({
                error: `An error occurred retrieving wallet`
            })
            if (row == undefined) return result({
                error: 'No wallet found'
            })
    
            return result({ row })
        })
    }

    static async balance(user_label, result) {
        /** generate wallet address with label */
        const block_io = new BlockIo(process.env.BLOCK_IO_KEY)
        let response

        try {
            response = await block_io.get_address_by_label({ label: user_label })
            //console.log(JSON.stringify(response, null, 2));

        }
        catch(err) {
            console.log(err)
            return result({
                error: err
            })
        }

        return result(response.data)
    }
    
    static async create(user_label, result) {
        /** validate user */
        Wallet.found(user_label, async (found) => {
    
            if (found) return result({
                error: `Duplicate user wallet`
            });
    
            /** generate wallet address with label */
            const block_io = new BlockIo(process.env.BLOCK_IO_KEY)
            let response
    
            try {
                response = await block_io.get_new_address({ label: user_label })
                console.log(JSON.stringify(response, null, 2));
            }
            catch(err) {
                console.log(err)
                return result({
                    error: err
                })
            }
    
            const address = response.data.address
    
            /** Save wallet in local db */
            const db = new sqlite3.Database('wallet.db');
            let sql = `INSERT INTO wallet(user_label, address) VALUES('${user_label}', '${address}')`
            
            db.run(sql, (err) => {
                if (err) return result({
                    error: 'Error occured saving wallet'
                })
    
                return result(true)
            })

            return result(true)
        })
    }

    static async found(user_label, found) {
        const db = new sqlite3.Database('wallet.db');
    
        /** Prevent duplicate wallet label */
        let sql = `SELECT * FROM wallet WHERE user_label='${user_label}'`
        db.get(sql, async (err, row) => {
            if (err) return found(false)
            if (row == undefined) return found(false)
    
            return found(true)
        })
    }
}