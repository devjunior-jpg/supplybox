import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://btkvexlwkxobuylycnug.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_SsmIsG5aQF9xK3TRZRCdVw_WaQjmlhk'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const OFFICIAL_SUPPORT_PHONE = '92485866'

let allProducts = []

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

supabase
  .channel('public:products')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
    fetchProductsFromSupabase()
  })
  .subscribe()

window.addEventListener('DOMContentLoaded', () => {
    fetchProductsFromSupabase()
})