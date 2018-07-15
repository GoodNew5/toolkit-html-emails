# **Toolkit-html-emails**

## Start
```
npm start - start dev environment
npm run build - build
npm run mail - send test mail
```

## Locales
1. Check your file locales in directory ```localization/en.json```
2. To inject locales use ```${{foo}}$``` in your template (**see example bellow**)
3. **Important !** Make sure the key ```${{foo}}$``` exists in your locales



## Templates

1. use ```@@include('../partials/footer.html')``` to inject chunks, also if you want extends in your templates **see example bellow**
```
<!-- @@master  = ../layouts/base-layout.html-->
<!-- @@block  =  header -->
<!-- @@include('../partials/header.html') -->
<!-- @@close-->
<!-- @@block  =  content-->

<table border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0;" width="100%">
  <tr align="center">
    <td style="padding: 20px 30px 20px 30px; ">
      <span style="font-weight: bold; font-size: 20px; color: #272727; ">${{foo.bar}}$</span>
    </td>
  </tr>
</table>

  or some your content

<!-- @@close-->
<!-- @@block  =  footer-->
<!-- @@include('../partials/footer.html') -->
<!-- @@close-->
```