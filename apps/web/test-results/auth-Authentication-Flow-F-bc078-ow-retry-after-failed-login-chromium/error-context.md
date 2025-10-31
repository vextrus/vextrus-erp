# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Vextrus ERP" [level=1] [ref=e6]
      - paragraph [ref=e7]: Sign in to your account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - alert [ref=e10]:
          - img [ref=e11]
          - paragraph [ref=e14]: Internal server error
        - generic [ref=e15]:
          - text: Email address
          - textbox "Email address" [ref=e17]:
            - /placeholder: you@example.com
            - text: admin@vextrus.com
        - generic [ref=e18]:
          - text: Password
          - textbox "Password" [ref=e20]:
            - /placeholder: ••••••••
            - text: admin123
        - button "Sign in" [ref=e22] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e28]: Need help?
        - paragraph [ref=e30]: Contact your system administrator
    - paragraph [ref=e31]: © 2024 Vextrus ERP. All rights reserved.
  - region "Notifications alt+T"
  - alert [ref=e32]
```