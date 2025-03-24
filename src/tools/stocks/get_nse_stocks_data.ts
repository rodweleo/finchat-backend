import { supabaseClient } from "../../utils/supabaseClient"

export const get_nse_stocks_data = async () => {

    const { data, error } = await supabaseClient.from("nse_stocks")
        .select('*')

    if (error) {
        return {
            status: error.code,
            error: {
                message: error.message
            }
        }
    }

    return {
        stocks: data
    }
}