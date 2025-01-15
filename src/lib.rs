use leptos::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use js_sys::{Promise, Reflect, Function};
use wasm_bindgen::JsValue;
use wasm_bindgen::JsCast;
use log;
use std::collections::HashMap;
use gloo_utils::format::JsValueSerdeExt;
use serde::Deserialize;
use serde::de::{self, Deserializer};
use std::str::FromStr;
use web_sys::MouseEvent;

// Define structures to match the expected response formats
//Batch Prices
#[derive(Deserialize, Debug)]
struct FetchBatchPricesResponse {
    prices: HashMap<String, String>,
}

#[derive(Deserialize, Debug)]
struct DerivativePricesResponse {
    prices: HashMap<String, String>,
}

#[derive(Deserialize, Debug, Clone)]
struct GovernanceProposal {
    #[serde(rename = "proposal_id", deserialize_with = "deserialize_string_to_u64")]
    id: u64,
    #[serde(rename = "content")]
    content: ProposalContent,
    status: String,
}

#[derive(Deserialize, Debug, Clone)]
struct ProposalContent {
    title: String,
    description: String,
}

fn deserialize_string_to_u64<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: Deserializer<'de>,
{
    let s: String = Deserialize::deserialize(deserializer)?;
    u64::from_str(&s).map_err(de::Error::custom)
}

// Function to open a mailto link with a timestamped subject
fn open_mailto_with_timestamp() {
    if let Some(window) = web_sys::window() {
        let timestamp = js_sys::Date::new_0().to_locale_string("en-US", &js_sys::Object::new());
        let mailto_url = format!("mailto:?subject=Bug Report - {}", timestamp);
        window.open_with_url(&mailto_url).unwrap();
    }
}

// Helper function to call JavaScript functions on the `window` object
fn call_js_function(function_name: &str) -> Result<Function, JsValue> {
    let window = web_sys::window().expect("no global `window` exists");
    let func = Reflect::get(&window, &JsValue::from_str(function_name))?;
    func.dyn_into::<Function>()
}

//Event helper funciton
fn event_target_value(ev: &web_sys::Event) -> String {
    ev.target()
        .and_then(|t| t.dyn_into::<web_sys::HtmlInputElement>().ok())
        .map(|input| input.value())
        .unwrap_or_default()
}


//Function for fetching individual prices in a batch query
async fn fetch_batch_prices() -> Result<HashMap<String, String>, String> {
    if let Ok(js_func) = call_js_function("fetchBatchPrices") {
        if let Ok(promise) = js_func.call0(&web_sys::window().unwrap()).and_then(|val| val.dyn_into::<js_sys::Promise>()) {
            match wasm_bindgen_futures::JsFuture::from(promise).await {
                Ok(result) => {
                    log::info!("Raw result from fetchBatchPrices: {:?}", result);

                    // Deserialize the JsValue into FetchBatchPricesResponse
                    match result.into_serde::<FetchBatchPricesResponse>() {
                        Ok(response) => {
                            log::info!("Deserialized response: {:?}", response);
                            Ok(response.prices) // Extract and return only the prices
                        }
                        Err(e) => {
                            log::error!("Failed to deserialize response: {:?}", e);
                            Err(format!("Failed to deserialize response: {:?}", e))
                        }
                    }
                }
                Err(err) => {
                    log::error!("Promise resolution failed: {:?}", err);
                    Err("Failed to resolve the promise".to_string())
                }
            }
        } else {
            Err("Failed to cast JsValue to Promise".to_string())
        }
    } else {
        Err("fetchBatchPrices not defined".to_string())
    }
}

//Function for fetching derivative prices individually in a batch query
async fn fetch_derivative_prices() -> Result<HashMap<String, String>, String> {
    if let Ok(js_func) = call_js_function("fetchDerivativePrices") {
        if let Ok(promise) = js_func.call0(&web_sys::window().unwrap()).and_then(|val| val.dyn_into::<Promise>()) {
            match wasm_bindgen_futures::JsFuture::from(promise).await {
                Ok(result) => {
                    log::info!("Raw result from fetchDerivativePrices: {:?}", result);

                    // Deserialize the JsValue into DerivativePricesResponse
                    match result.into_serde::<DerivativePricesResponse>() {
                        Ok(response) => {
                            log::info!("Deserialized derivative prices: {:?}", response);
                            Ok(response.prices)
                        }
                        Err(e) => {
                            log::error!("Failed to deserialize derivative prices: {:?}", e);
                            Err(format!("Failed to deserialize response: {:?}", e))
                        }
                    }
                }
                Err(err) => {
                    log::error!("Promise resolution failed: {:?}", err);
                    Err("Failed to resolve the promise".to_string())
                }
            }
        } else {
            Err("Failed to cast JsValue to Promise".to_string())
        }
    } else {
        Err("fetchDerivativePrices not defined".to_string())
    }
}

// Function to fetch the stkd-SCRT to SCRT exchange rate
async fn fetch_stkd_scrt_exchange_rate() -> Result<f64, String> {
    if let Ok(js_func) = call_js_function("fetchSTKDExchangeRate") {
        if let Ok(promise) = js_func.call0(&web_sys::window().unwrap()).and_then(|val| val.dyn_into::<Promise>()) {
            match wasm_bindgen_futures::JsFuture::from(promise).await {
                Ok(result) => {
                    if let Some(rate) = result.as_f64() {
                        Ok(rate) 
                    } else {
                        Err("Failed to convert result to f64".to_string())
                    }
                }
                Err(err) => Err(format!("Promise resolution failed: {:?}", err)),
            }
        } else {
            Err("Failed to cast JsValue to Promise".to_string())
        }
    } else {
        Err("fetchSTKDExchangeRate function not found".to_string())
    }
}

// Call specific keplr functions
async fn get_wallet_address() -> Option<String> {
    if let Ok(js_func) = call_js_function("get_wallet_address") {
        if let Ok(promise) = js_func.call0(&web_sys::window().unwrap()).and_then(|val| val.dyn_into::<Promise>()) {
            if let Ok(js_value) = wasm_bindgen_futures::JsFuture::from(promise).await {
                return js_value.as_string();
            }
        }
    }
    None
}

fn disconnect_keplr_wallet() {
    if let Ok(js_func) = call_js_function("disconnectKeplrWallet") {
        js_func.call0(&web_sys::window().unwrap()).ok();
    }
}

async fn fetch_governance_proposals() -> Result<Vec<GovernanceProposal>, String> {
    if let Ok(js_func) = call_js_function("fetchGovernanceProposals") {
        if let Ok(promise) = js_func.call0(&web_sys::window().unwrap()).and_then(|val| val.dyn_into::<Promise>()) {
            match wasm_bindgen_futures::JsFuture::from(promise).await {
                Ok(result) => {
                    log::info!("Raw governance proposals JSON: {:?}", result);
                    result
                        .into_serde::<Vec<GovernanceProposal>>()
                        .map_err(|e| format!("Failed to deserialize governance proposals: {:?}", e))
                }
                Err(err) => Err(format!("Failed to resolve promise: {:?}", err)),
            }
        } else {
            Err("Failed to cast to Promise".to_string())
        }
    } else {
        Err("fetchGovernanceProposals not defined".to_string())
    }
}

// The main app component
#[component]
pub fn App(cx: Scope) -> impl IntoView {
    let (is_connected, set_connected) = create_signal(cx, false);
    let (wallet_address, set_wallet_address) = create_signal(cx, String::new());
    let (selected_section, set_selected_section) = create_signal(cx, "Home".to_string());
    let (prices, set_prices) = create_signal(cx, HashMap::new());
    let (governance_proposals, set_governance_proposals) = create_signal(cx, Vec::<GovernanceProposal>::new());
    let (proposals_fetched, set_proposals_fetched) = create_signal(cx, false);
    let (liquidation_price, set_liquidation_price) = create_signal(cx, 1.0_f64); // Default price is 1
    let (result, set_result) = create_signal(cx, String::new());
    let (exchange_rate, set_exchange_rate) = create_signal(cx, 1.0_f64);
    let (default_exchange_rate, set_default_exchange_rate) = create_signal(cx, 1.0_f64);
    let (derivative_prices, set_derivative_prices) = create_signal(cx, HashMap::<String, String>::new());
    let (redemption_rates, set_redemption_rates) = create_signal(cx, HashMap::<String, f64>::new());


    // Auto-fetch prices on page load
    create_effect(cx, move |_| {
        spawn_local(async move {
            match fetch_batch_prices().await {
                Ok(data) => set_prices(data),
                Err(err) => log::error!("Error fetching prices on load: {}", err),
            }
        });
    });  

    // Fetch derivative prices on page load
    create_effect(cx, move |_| {
        spawn_local(async move {
            match fetch_derivative_prices().await {
                Ok(data) => set_derivative_prices(data),
                Err(err) => log::error!("Error fetching derivative prices on load: {}", err),
            }
        });
    });    

    // Fetch all prices button function
    let fetch_all_prices = move |_| {
        spawn_local(async move {
            // Fetch batch prices
            match fetch_batch_prices().await {
                Ok(batch_data) => set_prices(batch_data),
                Err(err) => log::error!("Failed to fetch batch prices: {:?}", err),
            }
    
            // Fetch derivative prices
            match fetch_derivative_prices().await {
                Ok(derivative_data) => set_derivative_prices(derivative_data),
                Err(err) => log::error!("Failed to fetch derivative prices: {:?}", err),
            }
        });
    };  

    // Auto-fetch STKD exhcange rate on page load
    create_effect(cx, move |_| {
        spawn_local(async move {
            match fetch_stkd_scrt_exchange_rate().await {
                Ok(rate) => {
                    log::info!("Fetched stkd-SCRT to SCRT exchange rate: {}", rate);
                    set_exchange_rate(rate);
                    set_default_exchange_rate(rate); // Store as default
                }
                Err(err) => log::error!("Error fetching exchange rate: {}", err),
            }
        });
    });

    //Fetch stride redemption rates
    create_effect(cx, move |_| {
        spawn_local(async move {
            if let Ok(js_func) = call_js_function("fetchAllRedemptionRates") {
                if let Ok(promise) = js_func.call0(&web_sys::window().unwrap()).and_then(|val| val.dyn_into::<js_sys::Promise>()) {
                    match wasm_bindgen_futures::JsFuture::from(promise).await {
                        Ok(result) => {
                            if let Ok(rates) = result.into_serde::<HashMap<String, f64>>() {
                                log::info!("Fetched redemption rates: {:?}", rates);
                                set_redemption_rates(rates);
                            } else {
                                log::error!("Failed to deserialize redemption rates.");
                            }
                        }
                        Err(err) => {
                            log::error!("Failed to resolve fetchAllRedemptionRates promise: {:?}", err);
                        }
                    }
                }
            }
        });
    });
    
    
    // Keplr Functions
    let connect_wallet = move |_| {
        set_connected.set(true);
        spawn_local(async move {
            if let Some(address) = get_wallet_address().await {
                set_wallet_address.set(address);
            }
        });
    };

    let disconnect_wallet = move |_| {
        disconnect_keplr_wallet();
        set_connected.set(false);
        set_wallet_address.set(String::new());
    };

    //Fetch Governance Proposals
    create_effect(cx, move |_| {
        if selected_section.get().as_str() == "Vote" && !proposals_fetched.get() {
            set_proposals_fetched(true);
            spawn_local(async move {
                match fetch_governance_proposals().await {
                    Ok(proposals) => set_governance_proposals.set(proposals),
                    Err(err) => log::error!("Error fetching governance proposals: {}", err),
                }
            });
        }
    });    

    // UI with views
    view! {
        cx,
        <div class="container">
            <div class="top-bar">
                <div class="links">
                    <button class="link-button" on:click=move |_| set_selected_section.set("Home".to_string())>"Home"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Prices".to_string())>"Prices"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Tools".to_string())>"Tools"</button>
                    <button class="link-button" on:click=move |_| {
                        connect_wallet(());
                        set_selected_section.set("Wallet".to_string());
                    }>"Wallet"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Vote".to_string())>"Vote"</button>
                </div>
                <img src="/static/YoloNode-Logo-cropped.png" alt="YoloNode Logo" class="logo" />
            </div>
            <hr class="gold-line-top" />
            {move || match selected_section.get().as_str() {
                "Home" => view! { cx,
                    <div>
                        <div class="image-section">
                            <div class="button-container">
                                <a href="https://www.mintscan.io/secret/validators/secretvaloper1pkzmfk34qg46p4hen0dnlkn05rzje65xk4tzjc" 
                                    class="yellow-button"
                                    target="_blank">
                                    "Validator Info"
                                </a>
                                <a href="https://dash.scrt.network/staking" 
                                    class="yellow-button"
                                    target="_blank">
                                    "Stake With Us!"
                                </a>
                            </div>
                        </div>
                        <div class="main-section">
                            <div class="content">
                                <h1>"Web3's future needs privacy, and we're here to validate it!"</h1>
                                <br />
                                <h2>"Why Does Web3 Need Privacy?"</h2>
                                <br />
                                <p>"Traditional blockchains are typically fully transparent, making user data immediately public and available for analysis and research."</p>  
                                <br />
                                <p>"This level of transparency can render Web3 unsuitable for institutional players and can prevent its use entirely."</p>
                                <br />
                                <img src="/static/compliance.webp" alt="Compliance Image" class="main-image" />
                            </div>
                            <div class="content">
                            <h2>"What is Decentralized Confidential Computing (DeCC)?"</h2>
                            <br />
                            <p>
                                "Confidential computing has been around for years but is often mistakenly grouped with privacy chains which obscures its true potential. "
                                <strong>"DeCC"</strong>
                                " is a distinct category that ensures compliance and supports corporate use cases."
                                <br /><br />
                                <strong>"DeCC"</strong>
                                " enables protected computing, allowing arbitrary computations on data without exposing it to the world. Additionally, confidential computing facilitates opt-in compliance. Users can decide who can access their data and when with fine-grained access controls."
                            </p>
                            <br /><br />
                            <img src="/static/decc.webp" alt="DeCC Image" class="main-image" />
                        </div>
                        
                        <div class="content">
                            <h2>"New use cases enabled by DeCC infrastructure:"</h2>
                            <br />
                            <ul class="custom-list">
                                <li>"Decentralized on-chain identity that safeguards data privacy"</li>
                                <li>"Decentralized confidential document sharing"</li>
                                <li>"Verifiable on-chain Random Number Generation (RNG)"</li>
                                <li>"Confidential on-chain voting (e.g., for DAOs)"</li>
                                <li>"Confidential trading strategies for DeFi"</li>
                                <li>"AI model training on confidential data and/or with confidential parameters"</li>
                                <li>"NFTs with protected data, ensuring true ownership of content on Web3"</li>
                                <li>"Sealed-bid auctions for DeFi, DeSci, and NFTs"</li>
                                <li>"Various gaming applications"</li>
                            </ul>
                        </div>
                    
                        <div class="content">
                            <img src="/static/datacenter.webp" alt="DataCenter Image" class="main-image" />
                            <br /><br />
                            <h2>"How does it work?"</h2>
                            <br />
                            <p>
                                "Decentralized Confidential Computing leverages technologies like "
                                <strong>"ZKPs, MPC, FHE,"</strong>
                                " and "
                                <strong>"TEEs"</strong>
                                " for blockchain implementation. These tools enable decentralized confidential computations, securing user data with varying degrees of security, speed, and flexibility."
                                <br /><br />
                                <strong>"Trusted Execution Environments (TEE):"</strong>
                                " TEEs are secure areas within a processor that ensure code and data loaded inside are protected with respect to confidentiality and integrity. They offer fast and secure hardware-dependent computations."
                                <br /><br />
                                <strong>"Zero-Knowledge Proofs (ZKP):"</strong>
                                "  ZKPs allow one party to prove to another that they know a value, without revealing the value itself. For example, proving you have a password without showing the password."
                                <br /><br />
                                <strong>"Multi-Party Computation (MPC):"</strong>
                                "  MPC enables multiple parties to collaboratively compute a function over their inputs while keeping those inputs private. No single party can access all the confidential information."
                                <br /><br />
                                <strong>"Fully-Homomorphic Encryption:"</strong>
                                "  FHE allows computations to be performed on encrypted data without decrypting it. This means you can process data securely without exposing it."
                                <br /><br />
                                <strong>"Each has unique advantages, and combining them will be crucial for DeCC's future."</strong>
                                <br /><br />
                                <a href="https://scrt.network/" class="black-button">"Learn More"</a>
                            </p>
                        </div>
                    
                        <div class="content">
                            <img src="/static/hacker.webp" alt="Hacker Image" class="main-image" />
                            <br /><br />
                            <h2>"Bug Bounty Program"</h2>
                            <br />
                            <p>
                                "We offer a bug bounty reward to individuals who responsibly disclose security vulnerabilities in our systems. By reporting bugs in a responsible manner, you help us maintain the security and integrity of our services."
                                <br /><br />
                                "We value your contributions and will provide a monetary reward for verified vulnerabilities, ensuring that our platform remains safe for all users."
                                <br /><br />
                                "Thank you for helping us improve our security!"
                                <br /><br />
                                <a href="#" class="black-button" on:click=move |_| open_mailto_with_timestamp()>"Report A Bug"</a>
                            </p>
                        </div>
                    
                        <div class="content">
                            <h2>"Join us in building a safe and secure future!"</h2>
                            <br />
                            <a href="https://x.com/Yolo_Node" target="_blank">
                                <img src="/static/x-logo.webp" alt="X Logo" class="social-logo" />
                            </a>
                        </div>
                        </div>
                    </div>
                },
                "Prices" => view! { cx,
                    <div class="price-section">
                        <div class="price-section-header">
                            <h2>"Current Prices :"</h2>
                            <button class="link-button" on:click=fetch_all_prices>"Refresh Prices"</button>
                        </div>
                        <hr class="gold-line" />
                        <div class="price-list">
                            // Render regular prices
                            {let ordered_keys = vec!["BTC", "ETH", "SHD", "SCRT", "ATOM", "TIA", "SILK"];
                            move || ordered_keys.iter().map(|key| {
                                if let Some(value) = prices.get().get(*key) {
                                    view! {
                                        cx,
                                        <div class="price-row">
                                            <h3>{format!("{} :", key)}</h3>
                                            <div class="price-display">{format!("${}", value)}</div>
                                            <hr class="gold-line" />
                                        </div>
                                    }
                                } else {
                                    view! {
                                        cx,
                                        <div class="price-row">
                                            <h3>{format!("{} :", key)}</h3>
                                            <div class="price-display">"No Data"</div>
                                        </div>
                                    }
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                        <div class="price-section-header">
                            <h2>"Derivatives :"</h2>
                        </div>
                        <hr class="gold-line" />
                        <div class="price-list">
                            // Render derivative prices
                            {let derivative_keys = vec!["stkd-SCRT", "Stride ATOM", "Stride TIA"];
                            let display_key_map = HashMap::from([
                                ("stkd-SCRT", "stkdSCRT"),
                                ("Stride ATOM", "stATOM"),
                                ("Stride TIA", "stTIA"),
                            ]);
                
                            move || derivative_keys.iter().map(|key| {
                                let display_key = display_key_map.get(key).unwrap_or(key); // Get the display key or fallback to original key
                                if let Some(value) = derivative_prices.get().get(*key) {
                                    view! {
                                        cx,
                                        <div class="price-row">
                                            <h3>{format!("{} :", display_key)}</h3>
                                            <div class="price-display">{format!("${}", value)}</div>
                                            <hr class="gold-line" />
                                        </div>
                                    }
                                } else {
                                    view! {
                                        cx,
                                        <div class="price-row">
                                            <h3>{format!("{} :", display_key)}</h3>
                                            <div class="price-display">"No Data"</div>
                                        </div>
                                    }
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                        <div class="price-section-header">
                            <h2>"Ratios :"</h2>
                        </div>
                        <hr class="gold-line" />
                        <div class="price-list">
                            {move || {
                                // SHD/SCRT Ratio
                                let shd_to_scrt = if let (Some(shd_price), Some(scrt_price)) = (
                                    prices.get().get("SHD"),
                                    prices.get().get("SCRT"),
                                ) {
                                    let ratio = shd_price.parse::<f64>().unwrap_or(0.0) /
                                                scrt_price.parse::<f64>().unwrap_or(1.0);
                                    format!("{:.4}", ratio)
                                } else {
                                    "No Data".to_string()
                                };

                                // SHD/stkd-SCRT Ratio
                                let shd_to_stkd_scrt = if let (Some(shd_price), Some(stkd_scrt_price)) = (
                                    prices.get().get("SHD"),
                                    derivative_prices.get().get("stkd-SCRT"),
                                ) {
                                    let ratio = shd_price.parse::<f64>().unwrap_or(0.0) /
                                                stkd_scrt_price.parse::<f64>().unwrap_or(1.0);
                                    format!("{:.4}", ratio)
                                } else {
                                    "No Data".to_string()
                                };

                                // SHD/ATOM Ratio
                                let shd_to_atom = if let (Some(shd_price), Some(atom_price)) = (
                                    prices.get().get("SHD"),
                                    prices.get().get("ATOM"),
                                ) {
                                    let ratio = shd_price.parse::<f64>().unwrap_or(0.0) /
                                                atom_price.parse::<f64>().unwrap_or(1.0);
                                    format!("{:.4}", ratio)
                                } else {
                                    "No Data".to_string()
                                };

                                // SCRT/ATOM Ratio
                                let scrt_to_atom = if let (Some(scrt_price), Some(atom_price)) = (
                                    prices.get().get("SCRT"),
                                    prices.get().get("ATOM"),
                                ) {
                                    let ratio = scrt_price.parse::<f64>().unwrap_or(0.0) /
                                                atom_price.parse::<f64>().unwrap_or(1.0);
                                    format!("{:.4}", ratio)
                                } else {
                                    "No Data".to_string()
                                };                                

                                view! {
                                    cx,
                                    <>
                                        <div class="price-row">
                                            <h3>"SHD/SCRT :"</h3>
                                            <div class="price-display">{shd_to_scrt}</div>
                                            <hr class="gold-line" />
                                        </div>
                                        <div class="price-row">
                                            <h3>"SHD/STKD :"</h3>
                                            <div class="price-display">{shd_to_stkd_scrt}</div>
                                            <hr class="gold-line" />
                                        </div>
                                        <div class="price-row">
                                            <h3>"SHD/ATOM :"</h3>
                                            <div class="price-display">{shd_to_atom}</div>
                                            <hr class="gold-line" />
                                        </div>
                                        <div class="price-row">
                                            <h3>"SCRT/ATOM :"</h3>
                                            <div class="price-display">{scrt_to_atom}</div>
                                            <hr class="gold-line" />
                                        </div>                                        
                                    </>
                                }
                            }}
                        </div>
                    </div>                    
                },  
                "Wallet" => view! { cx,
                    <div class="wallet-section">
                        <div class="wallet-section-header">
                            <h2>"Wallet Info : "</h2>
                            {move || if is_connected.get() {
                                view! { cx,
                                    <button class="link-button" on:click=disconnect_wallet>"Disconnect Wallet"</button>
                                }
                            } else {
                                view! { cx,
                                    <button class="link-button" on:click=move |_: MouseEvent| connect_wallet(())>"Connect Wallet"</button>
                                }
                            }}
                        </div>
                        <hr class="gold-line" />
                        <div class="wallet-address-display">
                            {move || if is_connected.get() {
                                view! { cx,
                                    <div>
                                        <h3 class="wallet-address-label">"SCRT Address:"</h3>
                                        <p class="wallet-address">{wallet_address.get()}</p>
                                    </div>
                                }
                            } else {
                                view! { cx,
                                    <div>
                                        <p class="connect-prompt">"Please connect your wallet."</p>
                                    </div>
                                }
                            }}
                        </div>
                    </div>
                },                                                                                                                    
                "Vote" => view! { cx,
                    <div class="vote-section">
                        <h2>"Governance Proposals :"</h2>
                        <hr class="gold-line" />
                        <ul class="vote-list">
                        {move || {
                            let mut sorted_proposals = governance_proposals.get();
                            sorted_proposals.sort_by(|a, b| b.id.cmp(&a.id)); // Sort by id in descending order
                            sorted_proposals.iter().map(|proposal| {
                                // Determine the status class based on the proposal status
                                let status_class = match proposal.status.trim() {
                                    "PROPOSAL_STATUS_PASSED" => "passed",
                                    "PROPOSAL_STATUS_REJECTED" => "rejected",
                                    _ => "default",
                                };                                
                            view! {
                                cx,
                                <li>
                                    <h3>{format!("Proposal #{}: {}", proposal.id, proposal.content.title)}</h3>
                                    <p>{format!("Description: {}", proposal.content.description)}</p>
                                    <p class={format!("vote-status {}", status_class)}>
                                        {proposal.status.clone()} 
                                    </p>
                                    <hr class="gold-line" />
                                </li>
                            }
                            }).collect::<Vec<_>>()
                        }}
                        </ul>                    
                    </div>
                },                
                "Tools" => view! { cx,
                    <div class="tools-section">
                        <h2>"Derivative Price Converter :"</h2>
                        <hr class="gold-line" />
                        <h3>"Convert derivative liquidation points to base asset prices for use in triggers or alerts."</h3>
                        <div class="calculator">
                            <div class="input-row">
                                <label for="derivative-select">"Select Derivative:"</label>
                                <select
                                    id="derivative-select"
                                    on:change=move |ev| {
                                        if let Some(target) = ev.target().and_then(|t| t.dyn_into::<web_sys::HtmlSelectElement>().ok()) {
                                            let selected_value = target.value();
                                            log::info!("Selected Derivative: {}", selected_value);
                
                                            // Map derivative names to redemption_rates keys
                                            let key_map = HashMap::from([
                                                ("stkd-SCRT", None), // Use default_exchange_rate
                                                ("stAtom", Some("cosmoshub-4")),
                                                ("stTIA", Some("stTIA")),
                                            ]);
                
                                            match key_map.get(selected_value.as_str()) {
                                                Some(Some(key)) => {
                                                    if let Some(rate) = redemption_rates.get().get(*key) {
                                                        // Scale and format the rate
                                                        let scaled_rate = if *key == "cosmoshub-4" {
                                                            rate * 1e18
                                                        } else {
                                                            *rate
                                                        };
                                                        let formatted_rate = (format!("{:.6}", scaled_rate)).parse::<f64>().unwrap_or(scaled_rate);
                                                        log::info!("Formatted rate for {}: {}", selected_value, formatted_rate);
                                                        set_exchange_rate(formatted_rate);
                                                    } else {
                                                        log::warn!("No rate found for {}", selected_value);
                                                    }
                                                }
                                                Some(None) => set_exchange_rate(default_exchange_rate.get()), // Default for stkd-SCRT
                                                _ => {
                                                    log::warn!("Unexpected derivative: {}", selected_value);
                                                    set_exchange_rate(1.0); // Default fallback rate
                                                }
                                            }
                                        } else {
                                            log::error!("Failed to cast event target to HtmlSelectElement");
                                        }
                                    }
                                >
                                    <option value="stkd-SCRT" selected="selected">"stkd-SCRT"</option>
                                    <option value="stAtom">"stAtom"</option>
                                    <option value="stTIA">"stTIA"</option>
                                </select>
                            </div>
                            <div class="input-row">
                                <label for="liquidation-price">"Liquidation Price:"</label>
                                <input
                                    id="liquidation-price"
                                    type="number"
                                    step="0.00000001"
                                    placeholder="Enter liquidation price"
                                    value={move || format!("{:.6}", liquidation_price.get())}
                                    on:input=move |ev| {
                                        let raw_value = event_target_value(&ev);
                                        let parsed_value = raw_value.parse::<f64>().unwrap_or(0.0);
                                        set_liquidation_price(parsed_value);
                                    }
                                />
                            </div>
                            <div class="input-row">
                                <label for="exchange-rate">"Exchange Rate:"</label>
                                <input
                                    id="exchange-rate"
                                    type="number"
                                    step="0.00000001"
                                    placeholder="Enter exchange rate"
                                    value={move || format!("{:.6}", exchange_rate.get())}
                                    on:input=move |ev| {
                                        let raw_value = event_target_value(&ev);
                                        let parsed_value = raw_value.parse::<f64>().unwrap_or(1.0);
                                        set_exchange_rate(parsed_value);
                                    }
                                />
                            </div>
                            <button
                                class="calculate-button"
                                on:click=move |_| {
                                    let price = liquidation_price.get();
                                    let rate = exchange_rate.get();
                
                                    if price > 0.0 && rate > 0.0 {
                                        let base_asset_price = price / rate;
                                        set_result(format!("${:.6}", base_asset_price));
                                    } else if rate <= 0.0 {
                                        set_result("Invalid exchange rate. Please correct it.".to_string());
                                    } else {
                                        set_result("Please enter valid inputs.".to_string());
                                    }
                                }
                            >
                                "Calculate"
                            </button>
                            <div class="result">
                                <h3>"Base Asset Price :"</h3>
                                <p>{move || result.get()}</p>
                            </div>
                        </div>
                    </div>
                },                                                                                          
                _ => view! { cx,
                    <div class="error-section">
                        <p>"Section not found."</p>
                    </div>
                },
            }}
        </div>
    }
}

#[wasm_bindgen(start)]
pub fn start() {
    console_log::init_with_level(log::Level::Debug).expect("Error initializing log");
    log::info!("Application started");
    mount_to_body(|cx| view! { cx, <App /> });
}