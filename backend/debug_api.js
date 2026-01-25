const API_URL = 'http://localhost:5000/api';

const checkData = async () => {
    try {
        console.log('Fetching Shops...');
        const shopsRes = await fetch(`${API_URL}/shops`);
        const shops = await shopsRes.json();
        console.log(`✅ Shops Count: ${shops.length}`);
        if (shops.length > 0) {
            console.log('Sample Shop:', JSON.stringify(shops[0], null, 2));
        }

        console.log('\nFetching Beneficiaries...');
        const benRes = await fetch(`${API_URL}/beneficiaries`);
        const beneficiaries = await benRes.json();
        console.log(`✅ Beneficiaries Count: ${beneficiaries.length}`);

        if (beneficiaries.length > 0) {
            // Find one with an assigned shop
            const ben = beneficiaries.find(b => b.assignedShop);

            if (ben) {
                console.log('Sample Beneficiary with Shop:', JSON.stringify(ben, null, 2));
                const match = shops.find(s => s.name.toLowerCase().trim() === ben.assignedShop.toLowerCase().trim());
                console.log(`\nTEST MATCH: '${ben.assignedShop}' -> Found in Shops? ${match ? 'YES' : 'NO'}`);
            } else {
                console.log('⚠️ No beneficiaries found with assignedShop property.');
            }
        }

    } catch (err) {
        console.error('❌ API Verification Failed:', err.message);
    }
};

checkData();
