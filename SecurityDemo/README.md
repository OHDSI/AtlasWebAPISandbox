# WebAPI Security Demo



## Password Encoding

Starting with Spring 5, a new "delegating" password encoder is used to encode passwords.  This works by placing a prefix in front of the password value that indicates the encoding type.  Very secure:

* {bcrypt} - uses `BCryptPasswordEncoder`
* {pbdkf2} - uses `Pbdkf2PasswordEncoder`
* {scrypt} - uses `ScryptPasswordEncoder`
* {argon2} - uses `Argon2PasswordEncoder`

Less secure and/or legacy applications (such as current WebAPI) use approaches that are generally recognized as not secure:

* {noop} - Uses `NoOpPasswordEncoder` - no encryption is done.  Useful for testing.  Not for production.
* {sha256} - uses `StandardPasswordEncoder`
* {md5} - uses `MessageDigestPasswordEncoder`
* lots more...

*Note*: moving to a more secure password encryption may require some work on our part to *try* to upgrade existing encoded values, or may require that users provide new passwords.



