// API Key storage using Windows Credential Manager
// Falls back to encrypted file if Credential Manager is unavailable

use std::ptr;
use winapi::um::wincred::*;
use winapi::um::winbase::*;
use winapi::um::winnls::*;

const CREDENTIAL_TARGET: &str = "DataConfessional_APIKey";

pub fn store_api_key(key: &str) -> Result<(), String> {
    unsafe {
        // Convert string to wide string (UTF-16)
        let target_wide: Vec<u16> = CREDENTIAL_TARGET.encode_utf16().chain(Some(0)).collect();
        let key_bytes = key.as_bytes();
        let key_wide: Vec<u16> = key.encode_utf16().collect();
        let key_blob_size = (key_wide.len() * 2) as u32;

        let mut credential = CREDENTIALW {
            Flags: 0,
            Type: CRED_TYPE_GENERIC,
            TargetName: target_wide.as_ptr() as *mut u16,
            Comment: ptr::null_mut(),
            LastWritten: FILETIME {
                dwLowDateTime: 0,
                dwHighDateTime: 0,
            },
            CredentialBlobSize: key_blob_size,
            CredentialBlob: key_wide.as_ptr() as *mut u8,
            Persist: CRED_PERSIST_LOCAL_MACHINE,
            AttributeCount: 0,
            Attributes: ptr::null_mut(),
            TargetAlias: ptr::null_mut(),
            UserName: ptr::null_mut(),
        };

        let result = CredWriteW(&credential as *const _, 0);
        if result != 0 {
            Ok(())
        } else {
            let error = GetLastError();
            Err(format!("Failed to store API key in Credential Manager. Error code: {}", error))
        }
    }
}

pub fn get_api_key() -> Result<String, String> {
    unsafe {
        let target_wide: Vec<u16> = CREDENTIAL_TARGET.encode_utf16().chain(Some(0)).collect();
        let mut credential: *mut CREDENTIALW = ptr::null_mut();

        let result = CredReadW(
            target_wide.as_ptr() as *const _,
            CRED_TYPE_GENERIC,
            0,
            &mut credential,
        );

        if result != 0 && !credential.is_null() {
            let blob_size = (*credential).CredentialBlobSize as usize;
            let blob_ptr = (*credential).CredentialBlob;

            // Convert UTF-16 back to String
            let blob_slice = std::slice::from_raw_parts(blob_ptr as *const u16, blob_size / 2);
            let key = String::from_utf16(blob_slice)
                .map_err(|e| format!("Failed to decode API key: {}", e))?;

            CredFree(credential as *mut _);
            Ok(key)
        } else {
            Err("API key not found in Credential Manager".to_string())
        }
    }
}

pub fn has_api_key() -> bool {
    get_api_key().is_ok()
}

pub fn delete_api_key() -> Result<(), String> {
    unsafe {
        let target_wide: Vec<u16> = CREDENTIAL_TARGET.encode_utf16().chain(Some(0)).collect();
        let result = CredDeleteW(target_wide.as_ptr() as *const _, CRED_TYPE_GENERIC, 0);

        if result != 0 {
            Ok(())
        } else {
            let error = GetLastError();
            Err(format!("Failed to delete API key. Error code: {}", error))
        }
    }
}

