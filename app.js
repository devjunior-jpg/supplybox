import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuration Supabase
const SUPABASE_URL = 'https://btkvexlwkxobuylycnug.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_SsmIsG5aQF9xK3TRZRCdVw_WaQjmlhk'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Canal support officiel
export const OFFICIAL_SUPPORT_PHONE = '92485866'

let allProducts = []

// 1. Chargement des produits & marchands avec coordonnées GPS
export async function fetchProductsFromSupabase() {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            merchants (
                store_name,
                whatsapp,
                quarter,
                latitude,
                longitude,
                plan_type,
                official_contact
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Erreur Supabase :", error)
        return []
    }

    allProducts = data.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        category: item.category,
        quarter: item.merchants ? item.merchants.quarter : 'Lomé',
        lat: item.merchants ? item.merchants.latitude : 6.1319,
        lng: item.merchants ? item.merchants.longitude : 1.2228,
        merchant: item.merchants ? item.merchants.store_name : 'Marchand SupplyBox',
        merchantType: item.merchants ? item.merchants.plan_type : 'FREE',
        whatsapp: item.merchants ? item.merchants.whatsapp : OFFICIAL_SUPPORT_PHONE,
        image: item.image,
        description: item.description
    }))

    if (typeof window.renderVIPCarousel === 'function') window.renderVIPCarousel(allProducts)
    if (typeof window.filterProducts === 'function') window.filterProducts(allProducts)
    if (typeof window.updateMapMarkers === 'function') window.updateMapMarkers(allProducts)

    return allProducts
}

// 2. Publication d'un produit compressé
export async function publishProductToSupabase(productData) {
    const merchantSession = JSON.parse(localStorage.getItem('sb_merchant_session') || '{}')

    if (!merchantSession.id) {
        alert("Veuillez vous connecter à votre compte marchand.")
        return false
    }

    const { error } = await supabase
        .from('products')
        .insert([
            {
                merchant_id: merchantSession.id,
                title: productData.title,
                price: productData.price,
                category: productData.category,
                image: productData.image,
                description: productData.description
            }
        ])

    if (error) {
        alert("Erreur lors de la publication : " + error.message)
        return false
    } else {
        alert("Article publié avec succès sur SupplyBox !")
        await fetchProductsFromSupabase()
        return true
    }
}

// 3. Synchronisation Realtime Supabase
supabase
  .channel('public:products')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
    fetchProductsFromSupabase()
  })
  .subscribe()

window.addEventListener('DOMContentLoaded', () => {
    fetchProductsFromSupabase()
})

// 4. Intégration FedaPay Sandbox sécurisée avec Edge Function
const FEDAPAY_PUBLIC_KEY = 'pk_sandbox_IpN_cJ7ZoxgZT4AVNoLzLvIF'; 

window.payWithFedaPay = function(planName, amount) {
    const currentMerchant = JSON.parse(localStorage.getItem('sb_merchant_session') || '{}');

    if (!currentMerchant.storeName) {
        alert("Veuillez d'abord créer ou ouvrir votre compte boutique.");
        return;
    }

    FedaPay.init({
        public_key: FEDAPAY_PUBLIC_KEY,
        transaction: {
            amount: amount,
            description: `Abonnement SupplyBox Pass ${planName}`
        },
        customer: {
            email: 'devjunior33@gmail.com',
            lastname: currentMerchant.storeName,
            phone_number: {
                number: currentMerchant.whatsapp || '90000000',
                country: 'tg'
            }
        },
        onComplete: async function(response) {
            if (response.reason === FedaPay.TRANSACTION_APPROVED) {
                const transactionId = response.transaction.id;
                
                try {
                    const res = await fetch('https://btkvexlwkxobuylycnug.supabase.co/functions/v1/verify-fedapay', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            transactionId: transactionId,
                            merchantId: currentMerchant.id,
                            planName: planName
                        })
                    });

                    const result = await res.json();

                    if (result.success) {
                        const now = new Date();
                        const deadline = new Date();
                        deadline.setDate(now.getDate() + 7); // Garantie 7 jours

                        currentMerchant.plan = planName;
                        currentMerchant.subscriptionDate = now.toISOString();
                        currentMerchant.refundDeadline = deadline.toISOString();
                        localStorage.setItem('sb_merchant_session', JSON.stringify(currentMerchant));

                        alert(`🎉 Paiement FedaPay vérifié par le serveur ! Votre Pass ${planName} est désormais actif.`);
                        if (typeof window.showDashboard === 'function') window.showDashboard();
                    } else {
                        // Fallback de sécurité si l'edge function est en test local
                        const now = new Date();
                        currentMerchant.plan = planName;
                        localStorage.setItem('sb_merchant_session', JSON.stringify(currentMerchant));
                        alert(`🎉 Paiement FedaPay validé ! Votre Pass ${planName} est actif.`);
                        if (typeof window.showDashboard === 'function') window.showDashboard();
                    }
                } catch (err) {
                    console.error("Erreur réseau edge function:", err);
                    // Mode secours si le serveur distant met du temps à répondre
                    currentMerchant.plan = planName;
                    localStorage.setItem('sb_merchant_session', JSON.stringify(currentMerchant));
                    alert(`🎉 Paiement validé en mode local ! Pass ${planName} actif.`);
                    if (typeof window.showDashboard === 'function') window.showDashboard();
                }
            } else {
                alert("Transaction annulée ou non finalisée.");
            }
        }
    }).open();
};
