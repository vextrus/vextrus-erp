# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Vextrus ERP" [level=1] [ref=e6]
      - paragraph [ref=e7]: Sign in to your account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - text: Email address
          - textbox "Email address" [active] [ref=e12]:
            - /placeholder: you@example.com
            - text: notanemail
        - generic [ref=e13]:
          - text: Password
          - textbox "Password" [ref=e15]:
            - /placeholder: ••••••••
            - text: somepassword
        - button "Sign in" [ref=e17] [cursor=pointer]
      - generic [ref=e18]:
        - generic [ref=e23]: Need help?
        - paragraph [ref=e25]: Contact your system administrator
    - paragraph [ref=e26]: © 2024 Vextrus ERP. All rights reserved.
  - region "Notifications alt+T"
  - alert [ref=e27]
```