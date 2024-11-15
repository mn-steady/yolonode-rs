use async_trait::async_trait;
use keplr_sys::*;
use rsecret::wallet::*;
use secretrs::tx::{SignDoc, SignMode};
use serde::{Deserialize, Serialize};
use std::rc::Rc;
use send_wrapper::SendWrapper;
use web_sys::{console, JsValue};

pub struct Keplr {}

impl Keplr {
    pub fn is_available() -> bool {
        web_sys::window()
            .and_then(|window| {
                js_sys::Reflect::get(&window, &JsValue::from_str("keplr")).ok()
            })
            .map_or(false, |keplr| !keplr.is_undefined() && !keplr.is_null())
    }

    pub async fn enable(chain_id: &str) -> Result<(), JsValue> {
        let keplr = web_sys::window()
            .unwrap()
            .get("keplr")
            .expect("Keplr not available");
        keplr.call1("enable", &JsValue::from_str(chain_id))
    }

    pub async fn get_account(chain_id: &str) -> Result<AccountData, JsValue> {
        let signer = Self::get_offline_signer(chain_id);
        signer.get_accounts().await.map(|accounts| accounts[0].clone())
    }

    pub async fn get_secret20_viewing_key(chain_id: &str, contract_address: &str) -> Result<String, JsValue> {
        let keplr = web_sys::window().unwrap().get("keplr").expect("Keplr not available");
        keplr.call2("getSecret20ViewingKey", &JsValue::from_str(chain_id), &JsValue::from_str(contract_address))
    }

    fn get_offline_signer(chain_id: &str) -> KeplrOfflineSigner {
        get_offline_signer(chain_id).into()
    }
}
