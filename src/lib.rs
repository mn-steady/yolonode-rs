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

// Define structures to match the expected response formats
//Batch Prices
#[derive(Deserialize, Debug)]
struct FetchBatchPricesResponse {
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

    // Auto-fetch prices on page load
    create_effect(cx, move |_| {
        spawn_local(async move {
            match fetch_batch_prices().await {
                Ok(data) => set_prices(data),
                Err(err) => log::error!("Error fetching prices on load: {}", err),
            }
        });
    });

    // Fetch governance proposals when "Vote" is selected
    create_effect(cx, move |_| {
        if selected_section.get().as_str() == "Vote" {
            spawn_local(async move {
                match fetch_governance_proposals().await {
                    Ok(proposals) => set_governance_proposals.set(proposals),
                    Err(err) => log::error!("Error fetching governance proposals: {}", err),
                }
            });
        }
    });

    let fetch_all_prices = move |_| {
        spawn_local(async move {
            match fetch_batch_prices().await {
                Ok(data) => set_prices(data),
                Err(err) => log::error!("Failed to fetch batch prices: {:?}", err),
            }
        });
    };

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

    // UI with views
    view! {
        cx,
        <div class="container">
            <div class="top-bar">
                <div class="links">
                    <button class="link-button" on:click=move |_| set_selected_section.set("Home".to_string())>"Home"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Prices".to_string())>"Prices"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Vote".to_string())>"Vote"</button>
                    <button class="link-button" on:click=move |_| set_selected_section.set("Tools".to_string())>"Tools"</button>
                </div>
                <div class="wallet-info">
                    {move || if is_connected.get() {
                        view! { cx,
                            <span class="wallet-address">"SCRT Address: " {wallet_address.get()}</span>
                        }
                    } else {
                        view! { cx,
                            <span class="wallet-address"></span>
                        }
                    }}
                </div>
                {move || if is_connected.get() {
                    view! { cx,
                        <button class="link-button" on:click=disconnect_wallet>
                            "Logout Keplr"
                        </button>
                    }
                    } else {
                        view! { cx,
                            <button class="link-button" on:click=connect_wallet>
                                "Connect Wallet"
                            </button>
                        }
                    }}
            </div>
            <hr class="gold-line" />
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
                        <h2>"Current Prices"</h2>
                        <button class="link-button" on:click=fetch_all_prices>"Refresh All Prices"</button>
                        <hr class="gold-line" />
                        <div class="price-list">
                            {let ordered_keys = vec!["BTC", "ETH", "SHD", "SCRT", "stkd-SCRT", "SILK"];
                            move || ordered_keys.iter().map(|key| {
                                if let Some(value) = prices.get().get(*key) {
                                    view! {
                                        cx,
                                        <div class="price-row">
                                            <h3>{format!("{} Price:", key)}</h3>
                                            <div class="price-display">{format!("${}", value)}</div>
                                            <hr class="gold-line" />
                                        </div>
                                        <hr class="gold-line" />
                                    }
                                } else {
                                    view! {
                                        cx,
                                        <div class="price-row">
                                            <h3>{format!("{} Price:", key)}</h3>
                                            <div class="price-display">"No Data"</div>
                                        </div>
                                        <hr class="gold-line" />
                                    }
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                    </div>
                },
                "Vote" => view! { cx,
                    <div class="vote-section">
                        <h2>"Governance Proposals"</h2>
                        <hr class="gold-line" />
                        <ul>
                            {move || {
                                let mut sorted_proposals = governance_proposals.get();
                                sorted_proposals.sort_by(|a, b| b.id.cmp(&a.id)); // Sort by id in descending order
                                sorted_proposals.iter().map(|proposal| {
                                    view! {
                                        cx,
                                        <li>
                                            <h3>{format!("Proposal #{}: {}", proposal.id, proposal.content.title)}</h3>
                                            <p>{format!("Description: {}", proposal.content.description)}</p>
                                            <p>{format!("Status: {}", proposal.status)}</p>
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
                        <h2>"Tools | Utilities"</h2>
                        <p>"A place for additional tools and utilities."</p>
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
