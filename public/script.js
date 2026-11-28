let products = [];
let storeConfig = { azerbaijanCheckoutEnabled: true, azerbaijanShippingQuoteRequired: false };
const translations = {
  en: {
    shippingTo: 'Shipping to:', currencyNote: 'Prices shown in your selected currency',
    shop: 'Shop', about: 'About', trackOrder: 'Track order', categories: 'Categories',
    search: 'Search', cart: 'Cart', markets: 'USA • CANADA • UK • AZERBAIJAN',
    browse: 'Browse', whyDreamGrind: 'Why DreamGrind', orderStatus: 'Order status',
    orderTrackingIntro: 'No account or password is needed. Enter the order number and the email address used at checkout to securely view your order.',
    trackYourOrder: 'Track your order', track: 'Track order', trackGuestHelp: 'Guest order? Use the same email address you entered during checkout. You do not need to create an account.',
    stayInLoop: 'Stay in the loop', azComingSoon: 'Azerbaijan checkout is available. The displayed AZN price includes delivery and applicable charges confirmed for that product.'
  },
  az: {
    shippingTo: 'Çatdırılma ölkəsi:', currencyNote: 'Qiymətlər seçilmiş valyutada göstərilir',
    shop: 'Mağaza', about: 'Haqqımızda', trackOrder: 'Sifarişi izlə', categories: 'Kateqoriyalar',
    search: 'Axtarış', cart: 'Səbət', markets: 'ABŞ • KANADA • BK • AZƏRBAYCAN',
    browse: 'Kəşf et', whyDreamGrind: 'Niyə DreamGrind?', orderStatus: 'Sifarişin vəziyyəti',
    orderTrackingIntro: 'Hesab və ya parol lazım deyil. Sifarişinizə təhlükəsiz baxmaq üçün sifariş nömrəsini və checkout zamanı istifadə etdiyiniz e-poçt ünvanını daxil edin.',
    trackYourOrder: 'Sifarişinizi izləyin', track: 'Sifarişi izlə', trackGuestHelp: 'Qonaq kimi sifariş vermisiniz? Checkout zamanı yazdığınız e-poçt ünvanından istifadə edin. Hesab yaratmağa ehtiyac yoxdur.'
    stayInLoop: 'Yeniliklərdən xəbərdar ol', azComingSoon: 'Azərbaycan üzrə onlayn sifariş aktivdir. Göstərilən AZN qiymətinə həmin məhsul üçün təsdiqlənmiş çatdırılma və müvafiq xərclər daxildir.'
  }
};

// Customer-facing interface copy. Product names and customer-written descriptions are
// intentionally excluded so catalogue content remains exactly as entered by the store.
const uiCopy = {
  'Free shipping on selected orders': 'Seçilmiş sifarişlərdə pulsuz çatdırılma',
  'Shop': 'Mağaza', 'Categories': 'Kateqoriyalar', 'About': 'Haqqımızda', 'Cart': 'Səbət',
  'Order status': 'Sifarişin vəziyyəti', 'Track your order': 'Sifarişinizi izləyin', 'Track order': 'Sifarişi izlə', 'Guest order? Use the same email address you entered during checkout. You do not need to create an account.': 'Qonaq kimi sifariş vermisiniz? Checkout zamanı yazdığınız e-poçt ünvanından istifadə edin. Hesab yaratmağa ehtiyac yoxdur.', 'No account or password is needed. Enter the order number and the email address used at checkout to securely view your order.': 'Hesab və ya parol lazım deyil. Sifarişinizə təhlükəsiz baxmaq üçün sifariş nömrəsini və checkout zamanı istifadə etdiyiniz e-poçt ünvanını daxil edin.', 'Stay in the loop': 'Yeniliklərdən xəbərdar ol',
  '🇺🇸 United States': '🇺🇸 ABŞ', '🇨🇦 Canada': '🇨🇦 Kanada',
  '🇬🇧 United Kingdom': '🇬🇧 Birləşmiş Krallıq', '🇦🇿 Azerbaijan': '🇦🇿 Azərbaycan',
  'United States': 'ABŞ', 'Canada': 'Kanada', 'United Kingdom': 'Birləşmiş Krallıq', 'Azerbaijan': 'Azərbaycan',
  'Shipping info': 'Çatdırılma barədə', 'Prices shown in your selected currency': 'Qiymətlər seçilmiş valyutada göstərilir',
  'Search products, categories or keywords…': 'Məhsul, kateqoriya və ya açar söz axtarın…',
  'My account': 'Hesabım', 'Good finds for a better': 'Gündəlik həyat üçün',
  'everyday.': 'daha yaxşı seçimlər.',
  'Discover useful gadgets, home essentials and pet favorites for the little things that make life better.': 'Gündəlik həyatı daha rahat edən faydalı cihazları, ev əşyalarını və sevimli ev heyvanları üçün məhsulları kəşf edin.',
  'Explore the collection': 'Məhsullara baxın', 'Shop pet favorites': 'Ev heyvanları üçün məhsullar',
  'Guest checkout': 'Qonaq kimi sifariş', 'Epoint payment': 'Epoint ilə ödəniş', 'Customer support': 'Müştəri dəstəyi',
  'THE EVERYDAY EDIT': 'GÜNDƏLİK SEÇİMLƏR', 'FIND YOUR EVERYDAY': 'GÜNDƏLİK SEÇİMİNİZİ TAPIN',
  'CURATED WITH INTENTION': 'DİQQƏTLƏ SEÇİLİB', 'Little things. Better days.': 'Kiçik detallar. Daha gözəl günlər.',
  'Little things.': 'Kiçik detallar.', 'Better days.': 'Daha gözəl günlər.',
  'THOUGHTFUL FINDS': 'DÜŞÜNÜLMÜŞ SEÇİMLƏR', 'MADE SIMPLE': 'SADƏLİK ÜÇÜN', 'DISCOVER': 'KƏŞF ET',
  'YOUR NEXT FAVORITE ↗': 'NÖVBƏTİ SEVİMLİ MƏHSULUNUZ ↗',
  'Shop by category': 'Kateqoriyalar üzrə alış-veriş', 'View all': 'Hamısına bax',
  'Gadgets': 'Qadcetlər', 'Useful tech & accessories': 'Faydalı texnologiya və aksesuarlar',
  'Home': 'Ev', 'Simple everyday upgrades': 'Gündəlik rahatlıq üçün kiçik yeniliklər',
  'Pet': 'Ev heyvanları', 'Fun finds for companions': 'Sevimli dostlarınız üçün maraqlı məhsullar',
  'Lifestyle': 'Həyat tərzi', 'Travel, desk & daily carry': 'Səyahət, iş masası və gündəlik istifadə',
  'General': 'Digər', 'Everyday products & more': 'Gündəlik məhsullar və daha çoxu',
  'All': 'Hamısı', 'Featured': 'Seçilmiş', 'Top rated': 'Ən yüksək qiymətləndirilən',
  'Price: low to high': 'Qiymət: aşağıdan yuxarıya', 'Price: high to low': 'Qiymət: yuxarıdan aşağıya',
  'Trending products': 'Populyar məhsullar', 'No products found': 'Məhsul tapılmadı',
  'Try another search or category.': 'Başqa axtarış sözü və ya kateqoriya sınayın.', 'Clear filters': 'Filtrləri sıfırla',
  'Need a hand?': 'Köməyə ehtiyacınız var?', "Questions? We're here to help.": 'Suallarınız var? Kömək etməyə hazırıq.',
  "Contact DreamGrind directly by WhatsApp or email. We're happy to help with product, order and delivery questions.": 'Məhsul, sifariş və çatdırılma ilə bağlı suallarınız üçün DreamGrind ilə WhatsApp və ya e-poçt vasitəsilə birbaşa əlaqə saxlaya bilərsiniz.',
  'WhatsApp': 'WhatsApp', 'Email us': 'Bizə e-poçt göndərin',
  'A small store with a thoughtful shopping experience.': 'Düşünülmüş alış-veriş təcrübəsi təqdim edən kiçik mağaza.',
  'Curated': 'Diqqətlə seçilmiş', 'Products can be selected with usefulness and presentation in mind.': 'Məhsullar faydalılığı və təqdimatı nəzərə alınaraq seçilir.',
  'Transparent': 'Şəffaflıq', 'Shipping, order status and support information are designed to be visible.': 'Çatdırılma, sifariş vəziyyəti və dəstək məlumatları aydın şəkildə təqdim olunur.',
  'Human support': 'Canlı müştəri dəstəyi', 'Customers can contact the store directly rather than being left guessing.': 'Müştərilər sualları olduqda birbaşa mağaza ilə əlaqə saxlaya bilərlər.',
  'Track your order': 'Sifarişinizi izləyin',
  'Track': 'İzlə', 'Example: DG10001': 'Məsələn: DG10001', 'Get new product drops in your inbox.': 'Yeni məhsullar haqqında xəbərləri e-poçtunuza alın.',
  'Subscribe': 'Abunə ol', 'A modern storefront foundation for international customers.': 'Beynəlxalq müştərilər üçün müasir onlayn mağaza.',
  'Business Information': 'Biznes məlumatları', 'Individual Entrepreneur: Ehtiram Abdullayev': 'Fərdi sahibkar: Ehtiram Abdullayev',
  'Legal address: Yukhari Laki, Agdash District, Azerbaijan': 'Hüquqi ünvan: Azərbaycan, Ağdaş rayonu, Yuxarı Ləki',
  'Business activity: E-commerce and retail sales': 'Fəaliyyət: Elektron ticarət və pərakəndə satış',
  'Customer': 'Müştəri', 'Wishlist': 'Seçilmişlər', 'Support': 'Dəstək', 'Shipping': 'Çatdırılma',
  'Returns & refunds': 'Qaytarılma və geri ödənişlər', 'Contact us': 'Bizimlə əlaqə', 'Contact': 'Əlaqə', 'Legal': 'Hüquqi məlumatlar',
  'Privacy': 'Məxfilik', 'Terms': 'Şərtlər', 'Cookies': 'Kukilər', 'Message the store': 'Mağazaya mesaj göndər',
  'Product options': 'Məhsul seçimləri', 'Color': 'Rəng', 'Size': 'Ölçü', 'Choose option': 'Seçim edin',
  'Product images': 'Məhsul şəkilləri', 'Product image coming soon': 'Məhsul şəkli tezliklə əlavə ediləcək',
  'Your browser does not support video playback.': 'Brauzeriniz video oynatmağı dəstəkləmir.',
  'Back to shop': 'Mağazaya qayıt', 'Home': 'Ev', 'Breadcrumb': 'Naviqasiya', 'Product gallery': 'Məhsul qalereyası',
  'Product details': 'Məhsul haqqında', 'More product information': 'Məhsul barədə əlavə məlumat',
  'Open menu': 'Menyunu aç', 'Account': 'Hesab', 'Order number': 'Sifariş nömrəsi',
  'Shopping information': 'Alış-veriş məlumatları', 'Purchase actions': 'Alış-veriş əməliyyatları',
  'Main navigation': 'Əsas naviqasiya', 'Shopping benefits': 'Alış-veriş üstünlükləri',
  'DreamGrind brand artwork': 'DreamGrind brend təsviri', 'Sort products': 'Məhsulları çeşidlə',
  'Explore': 'Kəşf et', 'Delivery information': 'Çatdırılma barədə məlumat',
  'Being finalised for Azerbaijan': 'Azərbaycan üzrə onlayn checkout aktivdir',
  'Azerbaijan delivery details coming soon': 'Çatdırılma xərci yekun AZN qiymətinə daxildir',
  'Free shipping': 'Pulsuz çatdırılma', 'Secure checkout by Epoint': 'Epoint vasitəsilə təhlükəsiz ödəniş',
  'Limited-time offer ends in': 'Məhdud müddətli təklifin bitməsinə', 'Quantity': 'Miqdar',
  'Add to cart': 'Səbətə əlavə et', 'Buy now': 'İndi al', 'Shop with confidence': 'Rahatlıqla alış-veriş edin',
  'United States, Canada & UK': 'ABŞ, Kanada, Birləşmiş Krallıq və Azərbaycan', 'Secure payment': 'Təhlükəsiz ödəniş',
  'Processed through Epoint': 'Epoint vasitəsilə həyata keçirilir', 'No account required': 'Hesab yaratmaq tələb olunmur',
  'Shipping and returns information is shown below.': 'Çatdırılma və qaytarılma məlumatları aşağıda göstərilib.',
  'Shipping & returns': 'Çatdırılma və qaytarılma',
  'DreamGrind accepts orders for the United States, Canada, the United Kingdom and Azerbaijan. For Azerbaijan, only products with a confirmed final AZN price are available for normal checkout. The displayed price includes delivery and applicable import charges confirmed for that product and route. Please contact DreamGrind before returning an item so return instructions can be provided.': 'DreamGrind ABŞ, Kanada, Birləşmiş Krallıq və Azərbaycan üzrə sifariş qəbul edir. Azərbaycan üçün yalnız yekun AZN qiyməti təsdiqlənmiş məhsullar adi checkout vasitəsilə satışa açılır. Göstərilən qiymətə həmin məhsul və marşrut üçün təsdiqlənmiş çatdırılma və müvafiq idxal xərcləri daxildir. Məhsulu qaytarmazdan əvvəl təlimat üçün DreamGrind ilə əlaqə saxlayın.',
  'Wishlist': 'Seçilmişlər', 'Your wishlist is empty.': 'Seçilmişlər siyahınız boşdur.',
  'This product is not available in your shipping country.': 'Bu məhsul seçdiyiniz ölkəyə çatdırılmır.',
  'Added to wishlist': 'Seçilmişlərə əlavə edildi', 'Removed from wishlist': 'Seçilmişlərdən silindi',
  'Added to cart': 'Səbətə əlavə edildi', 'Removed from cart': 'Səbətdən silindi',
  'Please select an available color and size.': 'Mövcud rəng və ölçü seçimini edin.',
  'Not yet listed for Azerbaijan': 'Azərbaycan bazarı üçün hələ yerləşdirilməyib',
  'Not available in this market': 'Bu bazarda mövcud deyil', 'Not available': 'Mövcud deyil',
  'New': 'Yeni', 'Hot': 'Populyar', 'Best seller': 'Çox satılan',
  'Save': 'Qənaət:', 'From': 'Başlanğıc qiyməti:', 'Choose options': 'Seçimləri seç', 'Add': 'Əlavə et',
  'No image': 'Şəkil yoxdur', 'Toggle wishlist': 'Seçilmişlərə əlavə et/sil', 'View image': 'Şəkilə bax',
  'Your cart': 'Səbətiniz', 'Shipping country': 'Çatdırılma ölkəsi',
  'Subtotal': 'Ara cəm', 'Shipping': 'Çatdırılma', 'To be confirmed': 'Dəqiqləşdiriləcək',
  'Current subtotal': 'Cari ara cəm', 'Total': 'Yekun məbləğ', 'Checkout': 'Sifarişi rəsmiləşdir',
  'Orders opening soon': 'Sifariş qəbulu tezliklə açılacaq',
  'Azerbaijan orders are not open yet. Delivery pricing is being confirmed.': 'Azərbaycan üzrə adi onlayn sifariş aktivdir. Çatdırılma xərci məhsulun yekun AZN qiymətinə daxildir.',
  'Orders are available in Azerbaijan. Delivery fees are confirmed before payment.': 'Azərbaycan üzrə onlayn checkout aktivdir. Məhsulun yekun AZN qiymətinə təsdiqlənmiş çatdırılma və müvafiq xərclər daxildir.',
  'Orders available in Azerbaijan': 'Azərbaycan üzrə onlayn sifariş aktivdir',
  'Delivery included': 'Çatdırılma daxildir',
  'Included in displayed AZN price': 'Göstərilən AZN qiymətinə daxildir',
  'Delivery & applicable taxes included': 'Çatdırılma və müvafiq vergilər daxildir',
  'Included': 'Daxildir',
  'The displayed AZN price includes delivery and applicable charges confirmed for this offer. Secure payment by Epoint.': 'Göstərilən AZN qiymətinə bu təklif üçün təsdiqlənmiş çatdırılma və müvafiq xərclər daxildir. Epoint vasitəsilə təhlükəsiz ödəniş.',
  'Product subtotal': 'Məhsulların cəmi',
  'Submit order request': 'Sifariş sorğusu göndər',
  'Delivery fee awaiting confirmation': 'Çatdırılma haqqının təsdiqi gözlənilir',
  'Awaiting payment confirmation': 'Ödəniş təsdiqi gözlənilir',
  'Delivery quote pending': 'Çatdırılma qiyməti gözlənilir',
  'You will be charged in AZN. Secure payment by Epoint.': 'Ödəniş AZN ilə Epoint vasitəsilə təhlükəsiz həyata keçirilir.',
  'Please remove the outdated item from your cart and select its color/size again.': 'Köhnəlmiş məhsulu səbətdən silin və rəng/ölçü seçimini yenidən edin.',
  'Your cart is empty': 'Səbətiniz boşdur',
  'One or more products are not available for the selected destination.': 'Bir və ya bir neçə məhsul seçilmiş ünvana çatdırılmır.',
  'One or more products are not available for this destination. Change the country or remove those products before paying.': 'Bir və ya bir neçə məhsul bu ünvana çatdırılmır. Ödənişdən əvvəl ölkəni dəyişin və ya həmin məhsulları səbətdən silin.',
  'Checkout as a guest. No account is required. Enter your contact and delivery details to continue to secure payment.': 'Qonaq kimi sifariş verə bilərsiniz, hesab yaratmaq tələb olunmur. Təhlükəsiz ödənişə keçmək üçün əlaqə və çatdırılma məlumatlarınızı daxil edin.',
  'Checkout': 'Sifarişin rəsmiləşdirilməsi', 'Full name': 'Ad və soyad', 'Email': 'E-poçt', 'Mobile number': 'Mobil nömrə',
  'Country': 'Ölkə', 'Address': 'Ünvan', 'Address details (optional)': 'Ünvan detalları (istəyə bağlı)',
  'City / Town': 'Şəhər / Qəsəbə', 'Region / District': 'Rayon', 'State *': 'Ştat *', 'County (optional)': 'Qraflıq (istəyə bağlı)',
  'Province / Territory *': 'Əyalət / Ərazi *', 'Delivery notes (optional)': 'Çatdırılma qeydi (istəyə bağlı)',
  'Use a phone number that can receive delivery updates.': 'Çatdırılma bildirişlərini ala biləcəyiniz telefon nömrəsini daxil edin.',
  'Enter the state for the delivery address.': 'Çatdırılma ünvanının ştatını daxil edin.',
  'Enter the province or territory for the delivery address.': 'Çatdırılma ünvanının əyalətini və ya ərazisini daxil edin.',
  'County is optional for most UK delivery addresses.': 'Birləşmiş Krallıq ünvanlarının əksəriyyətində qraflıq məlumatı məcburi deyil.',
  'Enter the ZIP code for the delivery address.': 'Çatdırılma ünvanının poçt indeksini daxil edin.',
  'Enter the Canadian postal code, including the space if shown.': 'Kanada poçt indeksini göstərildiyi kimi, boşluq daxil olmaqla yazın.',
  'Enter the UK postcode as provided by the recipient.': 'Alıcının təqdim etdiyi Birləşmiş Krallıq poçt indeksini daxil edin.',
  'Choose the delivery destination first. The address fields will adjust to this country.': 'Əvvəlcə çatdırılma ölkəsini seçin. Ünvan sahələri seçiminizə uyğun dəyişəcək.',
  'Street address': 'Küçə və ev ünvanı', 'Apartment, building, entrance': 'Mənzil, bina, giriş',
  'Landmark or instructions for the courier': 'Yaxınlıqdakı tanınan yer və ya kuryer üçün təlimat',
  'Country changed. Please confirm the region and postal code for the new destination.': 'Ölkə dəyişdirildi. Yeni ünvan üçün rayon və poçt indeksini yoxlayın.',
  'Azerbaijan orders are not open yet. Checkout will be enabled after delivery and customs arrangements are confirmed.': 'Azərbaycan üzrə adi onlayn checkout aktivdir. Yalnız yekun AZN qiyməti təsdiqlənmiş məhsullar satışdadır.',
  'Continue to secure payment': 'Təhlükəsiz ödənişə keç',
  'My account': 'Hesabım', 'Login': 'Daxil ol', 'Create account': 'Hesab yarat', 'Password': 'Şifrə',
  'Your password is handled by the server and is not stored in your browser local storage.': 'Şifrəniz server tərəfindən təhlükəsiz şəkildə idarə olunur və brauzerinizin yaddaşında saxlanılmır.',
  'Welcome back,': 'Xoş gəlmisiniz,', 'Account type:': 'Hesab növü:', 'Admin': 'Administrator', 'Customer': 'Müştəri',
  'My orders': 'Sifarişlərim', 'Message the store': 'Mağazaya mesaj göndər', 'Admin panel': 'İdarəetmə paneli', 'Log out': 'Çıxış et',
  'Please log in first': 'Əvvəlcə hesabınıza daxil olun', 'No orders yet.': 'Hələ sifariş yoxdur.',
  'Contact DreamGrind': 'DreamGrind ilə əlaqə', 'You': 'Siz', 'No messages yet.': 'Hələ mesaj yoxdur.',
  'Send us a message. You do not need to create an account.': 'Bizə mesaj göndərin. Bunun üçün hesab yaratmaq lazım deyil.',
  'Your name': 'Adınız', 'Email address': 'E-poçt ünvanı', 'Your message': 'Mesajınız',
  'How can we help?': 'Sizə necə kömək edə bilərik?', 'Send message': 'Mesajı göndər',
  'Message sent. We will get back to you by email.': 'Mesajınız göndərildi. Sizinlə e-poçt vasitəsilə əlaqə saxlayacağıq.',
  'Message sent': 'Mesaj göndərildi', 'Account created': 'Hesab yaradıldı', 'Logged in': 'Hesaba daxil oldunuz',
  'Unable to create account': 'Hesab yaratmaq mümkün olmadı', 'Unable to sign in': 'Hesaba daxil olmaq mümkün olmadı',
  'Preparing secure payment…': 'Təhlükəsiz ödəniş hazırlanır…', 'Please check your details and try again.': 'Məlumatları yoxlayıb yenidən cəhd edin.',
  'Order was created, but secure payment could not be started. Contact support with your order number.': 'Sifariş yaradıldı, lakin ödənişi başlatmaq mümkün olmadı. Sifariş nömrənizlə dəstək xidmətinə müraciət edin.',
  'Unable to continue to payment. Please try again.': 'Ödənişə keçmək mümkün olmadı. Yenidən cəhd edin.',
  'Enter an order number.': 'Sifariş nömrəsini daxil edin.', 'Order not found.': 'Sifariş tapılmadı.',
  'Order placed': 'Sifariş qəbul edildi', 'Order received': 'Sifariş qeydə alındı', 'Processing': 'Emal olunur',
  'Preparing your order': 'Sifarişiniz hazırlanır', 'Shipped': 'Göndərildi', 'Tracking number assigned': 'İzləmə nömrəsi təyin edildi',
  'In transit': 'Yoldadır', 'Package moving through carrier network': 'Bağlama daşıyıcı şəbəkəsində hərəkət edir',
  'Delivered': 'Çatdırıldı', 'Final carrier scan': 'Daşıyıcının son qeydi', 'Created': 'Yaradılma tarixi', 'Status:': 'Vəziyyət:',
  'Awaiting payment': 'Ödəniş gözlənilir', 'Cancelled': 'Ləğv edildi', 'Refunded': 'Geri ödənildi',
  'Total:': 'Yekun məbləğ:', 'Track order': 'Sifarişi izlə', 'Payment successful. Thank you for your order!': 'Ödəniş uğurla tamamlandı. Sifarişiniz üçün təşəkkür edirik!',
  'Payment was not completed. Your cart is still saved.': 'Ödəniş tamamlanmadı. Səbətiniz saxlanılıb.',
  'Shipping Policy': 'Çatdırılma siyasəti', 'Shipping destinations': 'Çatdırılma ünvanları',
  'DreamGrind accepts orders from the United States, Canada, the United Kingdom and Azerbaijan. For Azerbaijan, only products with a confirmed final AZN price are available for normal checkout. The displayed price includes the product, delivery and applicable import charges confirmed for that specific offer.': 'DreamGrind ABŞ, Kanada, Birləşmiş Krallıq və Azərbaycan üzrə sifariş qəbul edir. Azərbaycan üçün yalnız yekun AZN qiyməti əvvəlcədən təsdiqlənmiş məhsullar adi checkout vasitəsilə satılır. Göstərilən qiymətə məhsul, çatdırılma və həmin təklif üçün təsdiqlənmiş müvafiq idxal xərcləri daxildir.',
  'Shipping cost': 'Çatdırılma haqqı', 'For Azerbaijan, there is no separate shipping line at checkout because the confirmed delivery cost is included in the displayed AZN product price. For other destinations, the shipping amount shown at checkout applies.': 'Azərbaycan üçün checkout zamanı ayrıca çatdırılma haqqı göstərilmir, çünki təsdiqlənmiş çatdırılma xərci məhsulun AZN qiymətinə daxildir. Digər ölkələr üçün checkout-da göstərilən çatdırılma məbləği tətbiq olunur.',
  'Processing time': 'Sifarişin hazırlanma müddəti',
  'Orders are normally processed after successful payment confirmation. Processing and delivery times may vary depending on the destination, product availability and carrier.': 'Sifarişlər ödəniş uğurla təsdiqləndikdən sonra emal olunur. Hazırlanma və çatdırılma müddəti ünvandan, məhsulun mövcudluğundan və daşıyıcı şirkətdən asılı olaraq dəyişə bilər.',
  'Tracking': 'İzləmə', 'When tracking information is available, it may be provided to the customer after the order has been dispatched.': 'İzləmə məlumatı mövcud olduqda, sifariş göndərildikdən sonra müştəriyə təqdim edilir.',
  'Delivery delays': 'Çatdırılmada gecikmələr',
  'DreamGrind is not responsible for delays caused by carriers, customs procedures, weather or other circumstances outside our reasonable control.': 'Daşıyıcı şirkətlərin, gömrük prosedurlarının, hava şəraitinin və nəzarətimizdən kənar digər halların yaratdığı gecikmələrə görə DreamGrind məsuliyyət daşımır.',
  'Returns & Refunds': 'Qaytarılma və geri ödəniş', 'Return requests': 'Məhsulun qaytarılması müraciətləri',
  'Customers should contact DreamGrind before returning an item so that return instructions can be provided.': 'Müştərilər məhsulu qaytarmazdan əvvəl DreamGrind ilə əlaqə saxlamalıdırlar ki, qaytarılma qaydaları onlara bildirilsin.',
  'Damaged or incorrect items': 'Zədələnmiş və ya yanlış məhsullar',
  'If an item arrives damaged, defective or different from the item ordered, please contact customer support with the order number and relevant details as soon as possible.': 'Məhsul zədələnmiş, qüsurlu və ya sifariş ediləndən fərqli gəlibsə, mümkün qədər tez sifariş nömrəsi və müvafiq məlumatlarla müştəri dəstəyinə müraciət edin.',
  'Refunds': 'Geri ödənişlər',
  "Approved refunds are processed after the return or issue has been reviewed. The time required for the refund to appear in the customer's account may depend on the payment provider or bank.": 'Təsdiqlənmiş geri ödənişlər qaytarılma və ya problem araşdırıldıqdan sonra həyata keçirilir. Məbləğin müştərinin hesabına köçürülmə müddəti ödəniş provayderindən və ya bankdan asılı ola bilər.',
  'Exclusions': 'İstisnalar',
  'Items that have been used, damaged after delivery or returned without following the provided return instructions may not qualify for a refund.': 'İstifadə edilmiş, çatdırıldıqdan sonra zədələnmiş və ya təqdim olunan qaytarılma təlimatlarına əməl edilmədən geri göndərilmiş məhsullar geri ödəniş üçün uyğun olmaya bilər.',
  'Privacy Policy': 'Məxfilik siyasəti',
  '1. Information we collect': '1. Topladığımız məlumatlar',
  'DreamGrind may collect information that customers provide when creating an account, placing an order or contacting customer support. This may include name, email address, phone number, delivery address, city, country and order information.': 'DreamGrind müştərilərin hesab yaratması, sifariş verməsi və ya dəstək xidməti ilə əlaqə saxlaması zamanı təqdim etdiyi məlumatları toplaya bilər. Bu məlumatlara ad, e-poçt ünvanı, telefon nömrəsi, çatdırılma ünvanı, şəhər, ölkə və sifariş məlumatları daxil ola bilər.',
  '2. How we use information': '2. Məlumatlardan istifadə qaydası',
  'We use customer information to create and manage accounts, process orders, arrange delivery, provide order tracking, respond to customer requests, maintain website security and comply with applicable legal obligations.': 'Müştəri məlumatlarından hesabların yaradılması və idarə olunması, sifarişlərin emalı, çatdırılmanın təşkili, sifarişlərin izlənməsi, müraciətlərə cavab verilməsi, saytın təhlükəsizliyinin qorunması və qanuni öhdəliklərin yerinə yetirilməsi üçün istifadə edirik.',
  '3. Payments': '3. Ödənişlər',
  "Online payments are processed through our payment provider, Epoint. DreamGrind does not intentionally store customers' full payment card details on its own website servers.": 'Onlayn ödənişlər Epoint ödəniş provayderi vasitəsilə həyata keçirilir. DreamGrind müştərilərin bank kartı məlumatlarının tam rekvizitlərini öz sayt serverlərində qəsdən saxlamır.',
  '4. Service providers': '4. Xidmət təminatçıları',
  'We may use trusted third-party service providers for payment processing, website hosting, database infrastructure, delivery and other services necessary to operate the store. When an order is fulfilled by an overseas supplier or logistics partner, we may share the customer\'s name, phone number, delivery address and relevant order details with that provider only to arrange fulfilment, customs processing and delivery. This may involve transferring information to service providers outside the customer\'s country, subject to applicable legal requirements.': 'Mağazanın fəaliyyəti üçün ödəniş emalı, sayt hostinqi, verilənlər bazası infrastrukturu, çatdırılma və digər xidmətlər üzrə etibarlı üçüncü tərəf təminatçılarından istifadə edə bilərik. Sifariş xarici təchizatçı və ya logistika tərəfdaşı tərəfindən yerinə yetirildikdə, sifarişin hazırlanması, gömrük rəsmiləşdirilməsi və çatdırılmanın təşkili məqsədilə müştərinin adı, telefon nömrəsi, çatdırılma ünvanı və müvafiq sifariş məlumatları həmin tərəfdaşla paylaşıla bilər. Qüvvədə olan qanunvericiliyin tələblərinə uyğun olaraq məlumatlar müştərinin ölkəsindən kənarda yerləşən xidmət təminatçılarına ötürülə bilər.',
  '5. Cookies and local storage': '5. Kukilər və brauzerin lokal yaddaşı',
  'The website may use essential cookies and browser local storage to support account sessions, shopping cart preferences, country selection and language preferences.': 'Sayt hesab sessiyalarını, səbət seçimlərini, ölkə və dil parametrlərini təmin etmək üçün zəruri kukilərdən və brauzerin lokal yaddaşından istifadə edə bilər.',
  '6. Data retention': '6. Məlumatların saxlanılması',
  'Customer information is retained for as long as reasonably necessary to provide services, maintain business records, resolve disputes, prevent fraud and meet applicable legal requirements.': 'Müştəri məlumatları xidmət göstərilməsi, biznes qeydlərinin aparılması, mübahisələrin həlli, dələduzluğun qarşısının alınması və qanuni tələblərin yerinə yetirilməsi üçün zəruri olan müddət ərzində saxlanılır.',
  '7. Data security': '7. Məlumatların təhlükəsizliyi',
  'DreamGrind takes reasonable technical and organisational measures to protect customer information against unauthorised access, alteration or disclosure.': 'DreamGrind müştəri məlumatlarını icazəsiz girişdən, dəyişdirilmədən və açıqlanmadan qorumaq üçün müvafiq texniki və təşkilati tədbirlər görür.',
  '8. Contact': '8. Əlaqə',
  'Customers may contact DreamGrind through the Contact Us section of the website regarding privacy or personal information questions.': 'Məxfilik və şəxsi məlumatlarla bağlı suallar üçün müştərilər saytın Bizimlə əlaqə bölməsi vasitəsilə DreamGrind-ə müraciət edə bilərlər.',
  'Terms & Conditions': 'İstifadə şərtləri', '1. Website use': '1. Saytdan istifadə',
  'By using the DreamGrind website, you agree to use the website lawfully and not to misuse its services or attempt to interfere with its operation.': 'DreamGrind saytından istifadə etməklə siz saytdan qanuni şəkildə istifadə etməyi, xidmətlərindən sui-istifadə etməməyi və onun fəaliyyətinə müdaxilə etməməyinizi qəbul edirsiniz.',
  '2. Products and prices': '2. Məhsullar və qiymətlər',
  'Product availability, descriptions and prices may change without prior notice. We aim to keep product information accurate, but occasional errors may occur.': 'Məhsulların mövcudluğu, təsvirləri və qiymətləri əvvəlcədən xəbərdarlıq edilmədən dəyişə bilər. Məlumatların düzgünlüyünü təmin etməyə çalışırıq, lakin bəzən xətalar baş verə bilər.',
  '3. Orders': '3. Sifarişlər',
  'An order is submitted when the customer completes checkout. An order becomes a confirmed paid order only after successful payment confirmation.': 'Müştəri sifarişin rəsmiləşdirilməsi mərhələsini tamamladıqda sifariş göndərilmiş sayılır. Sifariş yalnız ödəniş uğurla təsdiqləndikdən sonra ödənişi tamamlanmış sifariş hesab olunur.',
  '4. Payment': '4. Ödəniş',
  'Payments are processed securely through Epoint. Orders may be cancelled or not completed when payment is declined, cancelled or otherwise unsuccessful.': 'Ödənişlər Epoint vasitəsilə təhlükəsiz şəkildə həyata keçirilir. Ödəniş rədd edildikdə, ləğv olunduqda və ya digər səbəbdən tamamlanmadıqda sifariş ləğv edilə və ya təsdiqlənməyə bilər.',
  '5. Shipping': '5. Çatdırılma',
  'Delivery times may vary depending on destination, product availability, customs procedures and carrier performance.': 'Çatdırılma müddəti ünvandan, məhsulun mövcudluğundan, gömrük prosedurlarından və daşıyıcı şirkətin fəaliyyətindən asılı olaraq dəyişə bilər.',
  '6. Returns and refunds': '6. Qaytarılma və geri ödənişlər',
  'Returns and refunds are handled according to the DreamGrind Returns & Refunds Policy.': 'Məhsulların qaytarılması və geri ödənişlər DreamGrind-in Qaytarılma və geri ödəniş siyasətinə uyğun həyata keçirilir.',
  '7. Changes to these terms': '7. Bu şərtlərə dəyişikliklər',
  'DreamGrind may update these terms when necessary. The current version published on the website will apply to future use of the website.': 'DreamGrind zərurət yarandıqda bu şərtləri yeniləyə bilər. Saytda dərc edilmiş cari versiya gələcək istifadəyə tətbiq ediləcək.',
  'Cookies & Local Storage': 'Kukilər və lokal yaddaş', 'How we use cookies and local storage': 'Kukilərdən və lokal yaddaşdan necə istifadə edirik',
  'DreamGrind uses essential browser storage technologies to support website functionality, including account sessions, shopping cart preferences, country selection and language preferences.': 'DreamGrind saytın işləməsini təmin etmək üçün hesab sessiyaları, səbət seçimləri, ölkə və dil parametrləri daxil olmaqla zəruri brauzer yaddaşı texnologiyalarından istifadə edir.',
  'Third-party services': 'Üçüncü tərəf xidmətləri',
  'Some services used by the website, such as payment processing or hosting infrastructure, may use their own technical cookies or similar technologies where necessary to provide their services.': 'Saytın istifadə etdiyi ödəniş emalı və hostinq infrastrukturu kimi bəzi xidmətlər öz xidmətlərini göstərmək üçün zəruri hallarda texniki kukilərdən və ya oxşar texnologiyalardan istifadə edə bilər.',
  'Not yet listed for Azerbaijan': 'Azərbaycan bazarı üçün hələ yerləşdirilməyib',
  'No products found': 'Məhsul tapılmadı',
  'Orders opening soon': 'Sifariş qəbulu tezliklə açılacaq',
  'Azerbaijan orders opening soon': 'Azərbaycan üzrə onlayn sifariş aktivdir',
  'Azerbaijan orders are coming soon. Delivery arrangements are being finalised.': 'Azərbaycan üzrə adi checkout aktivdir. Məhsulun yekun AZN qiymətinə çatdırılma daxildir.',
  'SMART LITTLE UPGRADES': 'AĞILLI GÜNDƏLİK YENİLİKLƏR',
  'MAKE IT YOUR SPACE': 'ÖZ MƏKANINI YARAT',
  'FOR YOUR COMPANIONS': 'SEVİMLİ DOSTLARINIZ ÜÇÜN',
  'Useful tech for everyday life': 'Gündəlik həyat üçün faydalı texnologiya',
  'Home finds': 'Ev üçün seçimlər',
  'Small touches for your space': 'Məkanınız üçün kiçik detallar',
  'Pet favorites': 'Ev heyvanları üçün seçimlər',
  'Find something for your best friend': 'Sevimli dostunuz üçün nəsə tapın',
  'each': 'ədəd', 'Option:': 'Seçim:', 'FREE': 'PULSUZ', 'Optional': 'İstəyə bağlı',
  'Some cart items were removed because they are not available in this country.': 'Bəzi məhsullar bu ölkəyə çatdırılmadığı üçün səbətdən silindi.',
  'Shipping country updated': 'Çatdırılma ölkəsi yeniləndi.', 'Email:': 'E-poçt:',
  'Azerbaijan orders are not open yet. Checkout will be enabled after delivery and customs arrangements are confirmed.': 'Azərbaycan üzrə adi onlayn checkout aktivdir. Yalnız yekun AZN qiyməti təsdiqlənmiş məhsullar satışdadır.',
  'Rayon / district *': 'Rayon *',
  'Enter the rayon or administrative area for the delivery address.': 'Çatdırılma ünvanının rayonunu daxil edin.',
  'Postal code (optional)': 'Poçt indeksi (istəyə bağlı)',
  'Postal code *': 'Poçt indeksi *',
  'Enter a postal code when available.': 'Mövcuddursa, poçt indeksini daxil edin.',
  'Enter the Azerbaijan postal code for the delivery address.': 'Çatdırılma ünvanının poçt indeksini daxil edin.',
  'e.g. AZ1000': 'məsələn, AZ1000',
  'e.g. California': 'məsələn, California', 'e.g. Ontario': 'məsələn, Ontario',
  'e.g. Yasamal': 'məsələn, Yasamal', 'e.g. SW1A 1AA': 'məsələn, SW1A 1AA',
  'e.g. K1A 0B1': 'məsələn, K1A 0B1', 'e.g. 90210': 'məsələn, 90210',
  'County, if applicable': 'Tətbiq olunursa, qraflıq', 'Select': 'Seçin',
  'This product is not available for delivery to': 'Bu məhsul aşağıdakı ünvana çatdırılmır:',
  'Please check your details and try again.': 'Məlumatları yoxlayıb yenidən cəhd edin.',
  'Invalid order details.': 'Sifariş məlumatları yanlışdır.',
  'Please check your name, email and password.': 'Adınızı, e-poçtunuzu və şifrənizi yoxlayın.',
  'An account with this email already exists.': 'Bu e-poçt ünvanı ilə hesab artıq mövcuddur.',
  'Email or password is incorrect.': 'E-poçt və ya şifrə yanlışdır.',
  'Unable to create account': 'Hesab yaratmaq mümkün olmadı',
  'Unable to sign in': 'Hesaba daxil olmaq mümkün olmadı',
  'Subscribed': 'Abunəlik tamamlandı', 'Enter a valid email.': 'Düzgün e-poçt ünvanı daxil edin.',
  'Unable to subscribe': 'Abunəlik yaratmaq mümkün olmadı',
  'Payment successful. Thank you!': 'Ödəniş uğurla tamamlandı. Təşəkkür edirik!',
  'Payment was not completed. Your cart is still saved.': 'Ödəniş tamamlanmadı. Səbətiniz saxlanılıb.',
  'Not available for this destination': 'Bu ünvana çatdırılmır',
  'Azerbaijan checkout is not open yet.': 'Azərbaycan üzrə sifarişlər müvəqqəti dayandırılıb.',
  'Orders opening soon': 'Sifariş qəbulu tezliklə açılacaq',
  'Product options': 'Məhsul seçimləri', 'Choose option': 'Seçim edin',
  'How to use': 'İstifadə qaydası', 'Specifications': 'Texniki xüsusiyyətlər',
  "What's included": 'Qutunun içindəkilər', 'Ingredients': 'Tərkibi',
  'Care instructions': 'Qulluq qaydaları', 'Shipping information': 'Çatdırılma məlumatı',
  'Returns & refunds': 'Qaytarılma və geri ödənişlər', 'Overview': 'Ümumi məlumat', 'Features': 'Xüsusiyyətlər',
  'THE DREAMGRIND EDIT': 'DREAMGRIND SEÇİMLƏRİ', 'Find something useful.': 'Faydalı bir şey kəşf edin.',
  'Explore products currently available for your selected delivery country.': 'Seçdiyiniz çatdırılma ölkəsində mövcud məhsullara baxın.',
  'A BETTER WAY TO BROWSE': 'DAHA RAHAT AXTARIŞ', 'DreamGrind Finder': 'DreamGrind Məhsul Tapıcısı',
  'Choose what you need and your budget. We will narrow the catalogue to products available in your selected market.': 'Ehtiyacınızı və büdcənizi seçin. Kataloqu seçdiyiniz bazarda mövcud məhsullara uyğun daraldacağıq.',
  'Category': 'Kateqoriya', 'All categories': 'Bütün kateqoriyalar', 'Maximum budget': 'Maksimum büdcə',
  'Any budget': 'İstənilən büdcə', 'Under 25': '25-dən aşağı', 'Under 50': '50-dən aşağı',
  'Under 100': '100-dən aşağı', 'Under 200': '200-dən aşağı',
  'Up to 25': '25-ə qədər', 'Up to 50': '50-yə qədər', 'Up to 100': '100-ə qədər', 'Up to 200': '200-ə qədər', 'What are you looking for?': 'Nə axtarırsınız?',
  'e.g. pet, home, travel': 'məsələn: ev heyvanı, ev, səyahət', 'Find products': 'Məhsul tap',
  'PICK UP WHERE YOU LEFT OFF': 'QALDIĞINIZ YERDƏN DAVAM EDİN', 'Recently viewed': 'Son baxılanlar',
  'HERE TO HELP': 'KÖMƏK ÜÇÜN BURADAYIQ', 'Good questions. Clear answers.': 'Suallarınıza aydın cavablar.',
  'A few useful details before you place an order.': 'Sifariş verməzdən əvvəl faydalı məlumatlar.',
  'Cookie settings': 'Kuki tənzimləmələri', 'Grind Points:': 'Grind xalları:',
  '(earned on paid orders while signed in; not redeemable yet)': '(hesaba daxil olaraq ödənilmiş sifarişlərdən qazanılır; hələ istifadə edilmir)',
  'THE EVERYDAY EDIT · EST. FOR BETTER DAYS': 'GÜNDƏLİK SEÇİMLƏR · DAHA GÖZƏL GÜNLƏR ÜÇÜN',
  'Find your next': 'Növbəti sevimli seçiminizi',
  'everyday favorite.': 'gündəlik seçimlər arasından tapın.',
  'Thoughtful gadgets, home details and pet finds chosen to make everyday routines a little better.': 'Gündəlik həyatınızı bir az da rahatlaşdırmaq üçün diqqətlə seçilmiş faydalı cihazlar, ev əşyaları və ev heyvanları üçün məhsullar.',
  'Discover the collection': 'Kolleksiyanı kəşf edin',
  'Explore the DreamGrind Edit': 'DreamGrind seçimlərinə baxın',
  'Guest checkout': 'Qonaq kimi sifariş',
  'Epoint payment': 'Epoint ilə ödəniş',
  'Customer support': 'Müştəri dəstəyi',
  'CURATED WITH INTENTION': 'DİQQƏTLƏ SEÇİLİB',
  'Little things.': 'Kiçik detallar.',
  'Better days.': 'Daha gözəl günlər.',
  'THOUGHTFUL FINDS': 'DÜŞÜNÜLMÜŞ SEÇİMLƏR',
  'MADE SIMPLE': 'SADƏLİK ÜÇÜN',
  'DISCOVER': 'KƏŞF ET',
  'YOUR NEXT FAVORITE ↗': 'NÖVBƏTİ SEVİMLİ MƏHSULUNUZ ↗',
  'Shop by category': 'Kateqoriyalar üzrə alış-veriş',
  'View all': 'Hamısına bax',
  'Useful tech & accessories': 'Faydalı texnologiya və aksesuarlar',
  'Simple everyday upgrades': 'Gündəlik rahatlıq üçün kiçik yeniliklər',
  'Fun finds for companions': 'Sevimli dostlarınız üçün maraqlı məhsullar',
  'Travel, desk & daily carry': 'Səyahət, iş masası və gündəlik istifadə',
  'Everyday products & more': 'Gündəlik məhsullar və daha çoxu',
  'Trending products': 'Populyar məhsullar',
  'CURATED FOR EVERYDAY': 'GÜNDƏLİK HƏYAT ÜÇÜN SEÇİLİB',
  'The DreamGrind Edit': 'DreamGrind seçimləri',
  'Thoughtful finds for the spaces, routines and little moments that make everyday better.': 'Gündəlik həyatınızı gözəlləşdirən məkanlar, vərdişlər və kiçik anlar üçün düşünülmüş seçimlər.',
  'Explore all finds': 'Bütün məhsullara baxın',
  '01 / HOME': '01 / EV',
  'The Cozy Home Edit': 'Rahat ev seçimləri',
  'Small upgrades for everyday spaces': 'Gündəlik məkanlar üçün kiçik yeniliklər',
  '02 / PETS': '02 / EV HEYVANLARI',
  'The Pet Parent Edit': 'Ev heyvanları üçün seçimlər',
  'Thoughtful finds for your companions': 'Sevimli dostlarınız üçün düşünülmüş seçimlər',
  '03 / GADGETS': '03 / QADCETLƏR',
  'The Everyday Upgrade': 'Gündəlik yeniliklər',
  'Useful details, smarter routines': 'Faydalı detallar, daha rahat gündəlik',
  '04 / LIFESTYLE': '04 / HƏYAT TƏRZİ',
  'The Little Things Edit': 'Kiçik detallar kolleksiyası',
  'Ideas for work, travel and daily life': 'İş, səyahət və gündəlik həyat üçün fikirlər',
  'Find something useful.': 'Faydalı bir şey kəşf edin.',
  'Explore products currently available for your selected delivery country.': 'Seçdiyiniz çatdırılma ölkəsində mövcud məhsullara baxın.',
  'Find something useful.': 'Faydalı bir şey kəşf edin.',
  'A small store with a thoughtful shopping experience.': 'Düşünülmüş alış-veriş təcrübəsi təqdim edən kiçik mağaza.',
  'Useful everyday finds': 'Gündəlik istifadə üçün faydalı seçimlər',
  'We focus on practical gadgets, thoughtful home finds and products for pets.': 'Faydalı cihazlara, ev üçün seçilmiş əşyalara və ev heyvanları üçün məhsullara diqqət yetiririk.',
  'Clear before you buy': 'Alışdan əvvəl aydın məlumat',
  'Check product details, available destinations, delivery information and confirmed charges before completing checkout.': 'Sifarişi tamamlamazdan əvvəl məhsul detallarını, çatdırılma ölkələrini, çatdırılma məlumatlarını və təsdiqlənmiş xərcləri yoxlayın.',
  'Real human support': 'Canlı müştəri dəstəyi',
  'Questions about a product or delivery? Contact our store directly before placing your order.': 'Məhsul və ya çatdırılma ilə bağlı sualınız var? Sifariş verməzdən əvvəl mağazamızla birbaşa əlaqə saxlayın.',
  'Good questions. Clear answers.': 'Suallarınıza aydın cavablar.',
  'A few useful details before you place an order.': 'Sifariş verməzdən əvvəl bir neçə faydalı məlumat.',
  'Need help? Chat with us': 'Kömək lazımdır? Bizimlə yazışın',
  'Chat with DreamGrind on WhatsApp': 'WhatsApp-da DreamGrind ilə yazışın',
  'Contact': 'Əlaqə',
  'Contact DreamGrind directly by WhatsApp or email. We\'re happy to help with product, order and delivery questions.': 'Məhsul, sifariş və çatdırılma ilə bağlı suallarınız üçün DreamGrind ilə WhatsApp və ya e-poçt vasitəsilə əlaqə saxlaya bilərsiniz.',
  'My account': 'Hesabım',
  'Wishlist': 'Seçilmişlər',
  'Support': 'Dəstək',
  'Contact us': 'Bizimlə əlaqə',
  'Email us': 'Bizə e-poçt göndərin',
  'Legal': 'Hüquqi məlumatlar',
  'Privacy': 'Məxfilik',
  'Terms': 'Şərtlər',
  'Cookies': 'Kukilər',
  'Message the store': 'Mağazaya mesaj göndər',
  'Back to shop': 'Mağazaya qayıt',
  'Recently viewed': 'Son baxılanlar',
  'Explore all finds': 'Bütün məhsullara baxın',
  'Shipping info': 'Çatdırılma barədə',
  'Search products, categories or keywords…': 'Məhsul, kateqoriya və ya açar söz axtarın…',
  'Open menu': 'Menyunu aç',
  'Account': 'Hesab',
  'Wishlist': 'Seçilmişlər',
  'Need a hand?': 'Köməyə ehtiyacınız var?',
  "Questions? We're here to help.": 'Suallarınız var? Kömək etməyə hazırıq.',
  'Email us': 'Bizə e-poçt göndərin',
  'Be first to discover new useful finds.': 'Yeni faydalı məhsulları ilk kəşf edənlərdən olun.',
  'Subscribe': 'Abunə ol',
  'Business Information': 'Biznes məlumatları',
  'Individual Entrepreneur: Ehtiram Abdullayev': 'Fərdi sahibkar: Ehtiram Abdullayev',
  'Legal address: Yukhari Laki, Agdash District, Azerbaijan': 'Hüquqi ünvan: Azərbaycan, Ağdaş rayonu, Yuxarı Ləki',
  'Business activity: E-commerce and retail sales': 'Fəaliyyət: Elektron ticarət və pərakəndə satış',
  'Customer': 'Müştəri',
  'Support': 'Dəstək',
  'Shipping': 'Çatdırılma',
  'Privacy': 'Məxfilik',
  'Terms': 'Şərtlər',
  'Cookies': 'Kukilər',
  'Need help? Chat with us': 'Kömək lazımdır? Bizimlə yazışın',
  'Chat with DreamGrind on WhatsApp': 'WhatsApp-da DreamGrind ilə yazışın',
  'Back to shop': 'Mağazaya qayıt',
  'Home': 'Ana səhifə',
  'Choose option': 'Seçim edin',
  'Shipping & returns': 'Çatdırılma və qaytarılma',
  'Special offer': 'Xüsusi təklif',
  'Useful': 'Faydalı',
  'Everyday find': 'Gündəlik seçim',
  'Curated': 'Diqqətlə seçilmiş',
  'DreamGrind edit': 'DreamGrind seçimləri',
  'Secure': 'Təhlükəsiz',
  'Explore every angle and detail': 'Bütün bucaqları və detalları kəşf edin',
  'product views': 'məhsul şəkli',
  'Be among the first verified customers to review this find.': 'Bu məhsula ilk təsdiqlənmiş rəy bildirən müştərilərdən biri olun.',
  'Clear product information': 'Məhsul haqqında aydın məlumat',
  'Secure checkout': 'Təhlükəsiz sifariş',
  'Thoughtfully selected by DreamGrind': 'DreamGrind tərəfindən diqqətlə seçilib',
  'Available for your selected delivery country': 'Seçdiyiniz çatdırılma ölkəsində mövcuddur',
  'Not available for this delivery country': 'Bu çatdırılma ölkəsində mövcud deyil',
  'Your browser does not support video playback.': 'Brauzeriniz video oynatmağı dəstəkləmir.',
  'Product details': 'Məhsul haqqında',
  'More product information': 'Məhsul barədə əlavə məlumat',
  'Quantity': 'Miqdar',
  'Add to cart': 'Səbətə əlavə et',
  'Buy now': 'İndi al',
  'Secure Epoint payment': 'Epoint ilə təhlükəsiz ödəniş',
  'Guest checkout': 'Qonaq kimi sifariş',
  'Direct customer support': 'Birbaşa müştəri dəstəyi',
  'THE DREAMGRIND EDIT': 'DREAMGRIND SEÇİMLƏRİ',
  'Good finds make everyday better.': 'Yaxşı seçimlər gündəlik həyatı gözəlləşdirir.',
  'Thoughtful design': 'Düşünülmüş dizayn',
  'Clear details': 'Aydın detallar',
  'Easy checkout': 'Rahat sifariş',
  'SEE THE DETAILS': 'DETALLARA BAXIN',
  'Explore this find': 'Bu məhsulu kəşf edin',
  'Special offer': 'Xüsusi təklif',
  'Limited-time offer ends in': 'Məhdud müddətli təklifin bitməsinə'
};

const uiCopyReverse = Object.fromEntries(Object.entries(uiCopy).map(([en, az]) => [az, en]));
let uiTranslationObserver = null;

function translateUiText(value, lang) {
  const original = String(value ?? '');
  const trimmed = original.trim();
  if (!trimmed) return original;
  const dictionary = lang === 'az' ? uiCopy : uiCopyReverse;
  let translated = dictionary[trimmed];
  if (translated === undefined) {
    if (lang === 'az') {
      translated = trimmed
        .replace(/Option:/g, 'Seçim:').replace(/Color:/g, 'Rəng:').replace(/Size:/g, 'Ölçü:')
        .replace(/^(\w+) products$/i, (_m, category) => `${uiCopy[category] || category} məhsulları`)
        .replace(/^Order (.+)$/i, 'Sifariş $1')
        .replace(/^Created (.+)$/i, 'Yaradılıb: $1')
        .replace(/^View image (\d+)$/i, 'Şəkil $1-ə bax')
        .replace(/^Rated ([\d.]+) out of 5$/i, '5 üzərindən $1 bal')
        .replace(/ reviews$/i, ' rəy')
        .replace(/^Save (\d+)%$/i, '$1% qənaət')
        .replace(/^Order (.+)\.$/i, 'Sifariş $1.')
        .replace(/^Welcome back,\s*(.+)\.$/i, 'Yenidən xoş gəlmisiniz, $1.')
        .replace(/^This product is not available for delivery to (.+)\.$/i, (_m, country) => `Bu məhsul ${({ 'the United States': 'ABŞ-a', 'Canada': 'Kanadaya', 'the United Kingdom': 'Birləşmiş Krallığa', 'Azerbaijan': 'Azərbaycana' }[country] || country)} çatdırılmır.`)
        .replace(/ each$/i, ' / ədəd')
        .replace(/^Payment successful\. Order (.+)\. Thank you!$/i, 'Ödəniş uğurla tamamlandı. Sifariş $1. Təşəkkür edirik!')
        .replace(/^Payment was not completed for (.+)\. Your cart is still saved\.$/i, 'Ödəniş tamamlanmadı: $1. Səbətiniz saxlanılıb.');
    } else {
      translated = trimmed
        .replace(/Seçim:/g, 'Option:').replace(/Rəng:/g, 'Color:').replace(/Ölçü:/g, 'Size:')
        .replace(/^(.+) məhsulları$/i, (_m, category) => `${uiCopyReverse[category] || category} products`)
        .replace(/^Sifariş (.+)$/i, 'Order $1')
        .replace(/^Yaradılıb: (.+)$/i, 'Created $1')
        .replace(/^Şəkil (\d+)-ə bax$/i, 'View image $1')
        .replace(/^5 üzərindən ([\d.]+) bal$/i, 'Rated $1 out of 5')
        .replace(/ rəy$/i, ' reviews')
        .replace(/^(\d+)% qənaət$/i, 'Save $1%')
        .replace(/^Yenidən xoş gəlmisiniz, (.+)\.$/i, 'Welcome back, $1.')
        .replace(/^Bu məhsul (.+) çatdırılmır\.$/i, (_m, country) => `This product is not available for delivery to ${{ 'ABŞ-a': 'the United States', 'Kanadaya': 'Canada', 'Birləşmiş Krallığa': 'the United Kingdom', 'Azərbaycana': 'Azerbaijan' }[country] || country}.`)
        .replace(/^Ödəniş uğurla tamamlandı\. Sifariş (.+)\. Təşəkkür edirik!$/i, 'Payment successful. Order $1. Thank you!')
        .replace(/^Ödəniş tamamlanmadı: (.+)\. Səbətiniz saxlanılıb\.$/i, 'Payment was not completed for $1. Your cart is still saved.')
        .replace(/ \/ ədəd$/i, ' each');
    }
    if (translated === trimmed) translated = undefined;
  }
  if (translated === undefined) return original;
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
}

function translateSubtree(root, lang) {
  if (!root) return;
  const skipSelector = 'script,style,textarea,.product-title,.product-page-title,.product-page-description,.product-page-feature-list,.variant-color-button,.variant-size-button';
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = root.parentElement;
    if (parent && !parent.closest(skipSelector)) {
      const translated = translateUiText(root.nodeValue, lang);
      if (translated !== root.nodeValue) root.nodeValue = translated;
    }
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest(skipSelector)) continue;
    const translated = translateUiText(node.nodeValue, lang);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }
  const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
  const translatedAttributes = ['placeholder', 'title', 'aria-label'];
  for (const element of elements) {
    if (element.matches(skipSelector)) continue;
    for (const attribute of translatedAttributes) {
      if (!element.hasAttribute(attribute)) continue;
      const current = element.getAttribute(attribute);
      const translated = translateUiText(current, lang);
      if (translated !== current) element.setAttribute(attribute, translated);
    }
  }
}

function applyLanguage(lang) {
  const selected = translations[lang] || translations.en;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (selected[key]) element.textContent = selected[key];
  });
  translateSubtree(document.body, lang);
  if (typeof updateCheckoutAddressFields === 'function' && $('coCountry')) {
    updateCheckoutAddressFields();
    const checkoutButton = $('coSubmitButton');
    if (checkoutButton) {
      checkoutButton.disabled = false;
      checkoutButton.textContent = lang === 'az' ? 'Təhlükəsiz ödənişə keç' : 'Continue to secure payment';
    }
  }
  const activeProduct = productPageOpen ? products.find(p => String(p.id) === new URLSearchParams(window.location.search).get('product')) : null;
  document.title = activeProduct ? `${activeProduct.title} | DreamGrind` : (lang === 'az' ? 'DreamGrind — Ağıllı alış-veriş burada başlayır' : 'DreamGrind — Smart Shopping Starts Here');
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = lang === 'az'
    ? 'DreamGrind — gündəlik həyat üçün faydalı məhsullar, cihazlar və ev əşyaları.'
    : 'DreamGrind — a modern storefront for customers in the USA, Canada, the UK and Azerbaijan.';
  if (!uiTranslationObserver && document.body) {
    uiTranslationObserver = new MutationObserver(records => {
      const currentLang = localStorage.getItem('dg_language') || 'en';
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) translateSubtree(node, currentLang);
        });
      }
    });
    uiTranslationObserver.observe(document.body, { childList: true, subtree: true });
  }
}

function setLanguage(language) {
  const lang = language === 'az' ? 'az' : 'en';

  localStorage.setItem('dg_language', lang);
  document.documentElement.lang = lang;

  applyLanguage(lang);
  syncCountryPicker();
  window.dispatchEvent(new Event('dg:language-change'));
}

function initLanguage() {
  const savedLanguage = localStorage.getItem('dg_language') || 'en';
  setLanguage(savedLanguage);
}
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to load products');
            return;
        }

        products = data.products || [];
        if (currencyConfig().country !== 'AZ') removeUnavailableCartItemsForCurrentCountry();
        renderProducts();
        window.dispatchEvent(new Event('dg:products-ready'));
        const initialProductId = new URLSearchParams(window.location.search).get('product');
        if (initialProductId) {
          productPageScrollY = 0;
          renderProductPage(initialProductId);
        }
    } catch (error) {
        console.error('Product loading error:', error);
    }
}


async function refreshStoreConfig() {
  try {
    const response = await fetch('/api/store-config', { cache: 'no-store' });
    if (response.ok) storeConfig = { ...storeConfig, ...(await response.json()) };
  } catch (error) {
    console.warn('Unable to load store configuration; keeping safe defaults.', error);
  }
  return storeConfig;
}

const state = { category: 'All', wishlist: new Set(JSON.parse(localStorage.getItem('dg_wishlist') || '[]')), cart: JSON.parse(localStorage.getItem('dg_cart') || '[]') };
let pendingCheckoutItems = null;
let productPageOpen = false;
let productPageScrollY = 0;
let productSaleTimer = null;
let activeProductVariant = null;
const originalDocumentTitle = document.title;
let toastTimer = null;
const $ = id => document.getElementById(id);
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
const USD_TO_AZN = 1.70;

function money(value, currency = 'AZN') {
  const locale = currency === 'AZN' ? 'az-AZ' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

function currencyConfig() {
  const queryCountry = new URLSearchParams(window.location.search).get('country');
  const storedCountry = localStorage.getItem('dg_country');
  const browserLanguage = String(navigator.languages?.[0] || navigator.language || '').toLowerCase();
  const firstVisitCountry = browserLanguage === 'az' || browserLanguage.startsWith('az-') ? 'AZ' : 'US';
  const country = ['US','CA','UK','AZ'].includes(queryCountry)
    ? queryCountry
    : (['US','CA','UK','AZ'].includes(storedCountry) ? storedCountry : firstVisitCountry);
  if (!storedCountry && !queryCountry) {
    localStorage.setItem('dg_country', country);
    if (!localStorage.getItem('dg_language')) {
      localStorage.setItem('dg_language', country === 'AZ' ? 'az' : 'en');
    }
  }

  const configs = {
    US: { country: 'US', currency: 'USD', rate: 1 },
    CA: { country: 'CA', currency: 'CAD', rate: 1.36 },
    UK: { country: 'UK', currency: 'GBP', rate: 0.75 },
    AZ: { country: 'AZ', currency: 'AZN', rate: 1 }
  };

  return configs[country] || configs.US;
}

function syncCountryPicker() {
  const c = currencyConfig();

  const picker = $('countryPicker');
  if (picker) picker.value = c.country;

  const label = $('currencyLabel');
  if (label) label.textContent = c.currency;
  const announcement = $('announcementText');
  if (announcement) {
    const az = localStorage.getItem('dg_language') === 'az';
    announcement.textContent = c.country === 'AZ'
      ? (az ? 'Azərbaycan üzrə onlayn ödəniş aktivdir' : 'Azerbaijan online checkout is available')
      : (az ? 'Seçilmiş sifarişlərdə pulsuz çatdırılma' : 'Free shipping on selected orders');
  }
}
function setCountry(country) {
  localStorage.setItem('dg_country', country);
  syncCountryPicker();
  const removedUnavailable = removeUnavailableCartItemsForCurrentCountry();
  renderProducts();
  window.dispatchEvent(new Event('dg:market-change'));

  if ($('modalRoot')?.querySelector('.drawer')) {
    openCart();
  }

  showToast(removedUnavailable
    ? 'Some cart items were removed because they are not available in this country.'
    : 'Shipping country updated');
}

// displayPrice converts a USD amount using the storefront's existing display rates.
function displayPrice(value) { const c = currencyConfig(); return money(value * c.rate, c.currency); }
// Product and cart prices returned by the country-aware helpers are already in local currency.
function displayCountryPrice(value) { return money(value, currencyConfig().currency); }
function isProductAvailableInCountry(product, country = currencyConfig().country) {
  if (country === 'AZ') return product?.availabilityByCountry?.AZ === true && Number(product?.countryPrices?.AZ) > 0;
  return product?.availabilityByCountry?.[country] !== false;
}
function countryBasePrice(product, country = currencyConfig().country) {
  if (country === 'US') return Number(product?.price || 0);
  const configured = product?.countryPrices?.[country];
  return Number.isFinite(Number(configured)) && Number(configured) > 0 ? Number(configured) : null;
}
function productPriceForCountry(product, now = Date.now()) {
  const country = currencyConfig().country;
  const usdPrice = effectiveProductPrice(product, now);
  if (country === 'US') return usdPrice;
  const customPrice = countryBasePrice(product, country);
  // Azerbaijan's entered AZN price is final and is never scaled by the USD sale ratio.
  if (country === 'AZ') return customPrice ?? 0;
  const baseUsd = Number(product?.price || 0);
  if (customPrice != null && baseUsd > 0) return Number((customPrice * usdPrice / baseUsd).toFixed(2));
  return Number((usdPrice * currencyConfig().rate).toFixed(2));
}
function variantPriceForCountry(product, combination, now = Date.now()) {
  const country = currencyConfig().country;
  const usdPrice = effectiveVariantPrice(product, combination, now);
  if (country === 'US') return usdPrice;
  const customPrice = countryBasePrice(product, country);
  // Azerbaijan variants use the final AZN amount entered in Admin, unchanged.
  if (country === 'AZ') return customPrice ?? 0;
  const baseUsd = Number(product?.price || 0);
  if (customPrice != null && baseUsd > 0) return Number((customPrice * usdPrice / baseUsd).toFixed(2));
  return Number((usdPrice * currencyConfig().rate).toFixed(2));
}
function compareAtPriceForCountry(product, combination = null, now = Date.now()) {
  const country = currencyConfig().country;
  // Admin does not collect an AZN compare-at amount, so do not invent one from USD.
  if (country === 'AZ') return null;
  const usdCompareAt = combination ? variantCompareAtPrice(product, combination, now) : variantCompareAtPrice(product, null, now);
  if (usdCompareAt == null) return null;
  if (country === 'US') return usdCompareAt;
  const customPrice = countryBasePrice(product, country);
  const baseUsd = Number(product?.price || 0);
  if (customPrice != null && baseUsd > 0) return Number((customPrice * usdCompareAt / baseUsd).toFixed(2));
  if (country === 'AZ') return 0; // Do not invent an AZN compare-at price.
  return Number((usdCompareAt * currencyConfig().rate).toFixed(2));
}
function removeUnavailableCartItemsForCurrentCountry() {
  const before = state.cart.length;
  state.cart = state.cart.filter(item => {
    const product = products.find(p => Number(p.id) === Number(item.id));
    return product && isProductAvailableInCountry(product);
  });
  if (state.cart.length !== before) saveAll();
  return state.cart.length !== before;
}

// A sale stays active only until its configured end time. After expiry, the
// compare-at price becomes the amount shown and charged, both in the UI/server.
function isProductSaleActive(product, now = Date.now()) {
  // Azerbaijan uses a separately entered final AZN price, independent of USD promotions.
  if (currencyConfig().country === 'AZ') return false;
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  if (!(compareAt > current && current > 0)) return false;
  if (product?.saleEndsAt) {
    const end = Date.parse(product.saleEndsAt);
    if (Number.isFinite(end) && end <= now) return false;
  }
  return true;
}
function effectiveProductPrice(product, now = Date.now()) {
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  if (compareAt > current && product?.saleEndsAt) {
    const end = Date.parse(product.saleEndsAt);
    if (Number.isFinite(end) && end <= now) return compareAt;
  }
  return current;
}
function productDiscountPercent(product) {
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  return compareAt > current && current > 0 ? Math.round((compareAt - current) / compareAt * 100) : 0;
}
function productVariantCombinations(product) {
  return Array.isArray(product?.variantCombinations) ? product.variantCombinations.filter(v => v && Number.isFinite(Number(v.price)) && Number(v.price) > 0) : [];
}
function normalizeVariantValue(value) {
  return String(value ?? '').trim().toLocaleLowerCase('en-US');
}
function findVariantCombination(product, color, size) {
  return productVariantCombinations(product).find(v => normalizeVariantValue(v.color) === normalizeVariantValue(color)
    && normalizeVariantValue(v.size) === normalizeVariantValue(size)) || null;
}
function effectiveVariantPrice(product, combination, now = Date.now()) {
  if (!combination) return effectiveProductPrice(product, now);
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  const variantPrice = Number(combination.price || 0);
  if (compareAt > current && current > 0 && product?.saleEndsAt) {
    const end = Date.parse(product.saleEndsAt);
    if (Number.isFinite(end) && end <= now) return Number((variantPrice * compareAt / current).toFixed(2));
  }
  return Number(variantPrice.toFixed(2));
}
function variantCompareAtPrice(product, combination, now = Date.now()) {
  if (!isProductSaleActive(product, now)) return null;
  if (!combination) return Number(product.oldPrice);
  const current = Number(product.price || 0);
  const compareAt = Number(product.oldPrice || 0);
  return current > 0 ? Number((Number(combination.price) * compareAt / current).toFixed(2)) : compareAt;
}
function variantCombinationLabel(combination) {
  if (!combination) return '';
  const az = localStorage.getItem('dg_language') === 'az';
  return [combination.color ? `${az ? 'Rəng' : 'Color'}: ${combination.color}` : '', combination.size ? `${az ? 'Ölçü' : 'Size'}: ${combination.size}` : ''].filter(Boolean).join(' · ');
}
function uniqueVariantValues(combinations, key) {
  const values = [];
  const seen = new Set();
  combinations.forEach(v => {
    const value = v[key];
    if (value == null || !String(value).trim()) return;
    const normalized = normalizeVariantValue(value);
    if (!seen.has(normalized)) { seen.add(normalized); values.push(String(value).trim()); }
  });
  return values;
}
function initialVariantCombination(product) {
  const combinations = productVariantCombinations(product);
  if (!combinations.length) return null;
  return [...combinations].sort((a, b) => effectiveVariantPrice(product, a) - effectiveVariantPrice(product, b))[0];
}
function variantSwatchColor(value) {
  const palette = {
    black:'#171717', white:'#ffffff', red:'#d94848', blue:'#3977d5', navy:'#263a67',
    green:'#2e8659', olive:'#78853b', yellow:'#f1cf43', pink:'#ec9db8', purple:'#875cbb',
    orange:'#ec8a38', brown:'#8b604a', beige:'#d9c7a3', cream:'#eee7d8', grey:'#8c9298',
    gray:'#8c9298', silver:'#bac0c6', gold:'#c9a14a', teal:'#2c9b90', mint:'#9bd7c4',
    khaki:'#aaa078', maroon:'#762e42', clear:'#f0f2f2', transparent:'#f0f2f2'
  };
  const tokens = String(value || '').trim().toLowerCase().split(/\s+/);
  for (const token of tokens.reverse()) if (palette[token]) return palette[token];
  return '#a8b9b4';
}
function renderProductVariantOptions(product) {
  const combinations = productVariantCombinations(product);
  if (!combinations.length) { activeProductVariant = null; return ''; }
  const initial = initialVariantCombination(product);
  activeProductVariant = { productId: String(product.id), color: initial.color ?? null, size: initial.size ?? null };
  const colors = uniqueVariantValues(combinations, 'color');
  const sizes = uniqueVariantValues(combinations, 'size');
  const colorMarkup = colors.length ? `
    <div class="variant-choice-group">
      <div class="variant-choice-heading"><label class="product-page-label">Color</label><span id="selectedVariantColorLabel">${escapeHtml(initial.color || '')}</span></div>
      <div class="variant-color-options">${colors.map(color => `
        <button type="button" class="variant-color-button ${normalizeVariantValue(initial.color) === normalizeVariantValue(color) ? 'active' : ''}" data-variant-dimension="color" data-variant-value="${escapeHtml(color)}" aria-pressed="${normalizeVariantValue(initial.color) === normalizeVariantValue(color) ? 'true' : 'false'}">
          <span class="variant-color-swatch" style="--variant-swatch:${variantSwatchColor(color)}" aria-hidden="true"></span><span>${escapeHtml(color)}</span>
        </button>`).join('')}</div>
    </div>` : '';
  const sizeMarkup = sizes.length ? `
    <div class="variant-choice-group">
      <div class="variant-choice-heading"><label class="product-page-label">Size</label><span id="selectedVariantSizeLabel">${escapeHtml(initial.size || '')}</span></div>
      <div class="variant-size-options">${sizes.map(size => `
        <button type="button" class="variant-size-button ${normalizeVariantValue(initial.size) === normalizeVariantValue(size) ? 'active' : ''}" data-variant-dimension="size" data-variant-value="${escapeHtml(size)}" aria-pressed="${normalizeVariantValue(initial.size) === normalizeVariantValue(size) ? 'true' : 'false'}">${escapeHtml(size)}</button>`).join('')}</div>
    </div>` : '';
  return `<section class="product-variant-picker" id="productVariantPicker" data-product-id="${escapeHtml(product.id)}" aria-label="Product options">${colorMarkup}${sizeMarkup}<p class="variant-combination-label" id="variantCombinationLabel">${escapeHtml(variantCombinationLabel(initial))}</p></section>`;
}
function selectedProductVariantCombination(product) {
  if (!activeProductVariant || String(activeProductVariant.productId) !== String(product?.id)) return null;
  return findVariantCombination(product, activeProductVariant.color, activeProductVariant.size);
}
function updateProductVariantUI(productId) {
  const product = products.find(p => String(p.id) === String(productId));
  if (!product || !productVariantCombinations(product).length) return;
  const combinations = productVariantCombinations(product);
  const selected = selectedProductVariantCombination(product);
  const colorButtons = $('modalRoot')?.querySelectorAll('[data-variant-dimension="color"]') || [];
  const sizeButtons = $('modalRoot')?.querySelectorAll('[data-variant-dimension="size"]') || [];
  colorButtons.forEach(button => {
    const value = button.dataset.variantValue;
    const active = normalizeVariantValue(value) === normalizeVariantValue(activeProductVariant?.color);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.disabled = !combinations.some(v => normalizeVariantValue(v.color) === normalizeVariantValue(value));
  });
  sizeButtons.forEach(button => {
    const value = button.dataset.variantValue;
    const active = normalizeVariantValue(value) === normalizeVariantValue(activeProductVariant?.size);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.disabled = !combinations.some(v => normalizeVariantValue(v.size) === normalizeVariantValue(value)
      && (!activeProductVariant?.color || normalizeVariantValue(v.color) === normalizeVariantValue(activeProductVariant.color)));
  });
  const colorLabel = $('selectedVariantColorLabel');
  if (colorLabel) colorLabel.textContent = activeProductVariant?.color || '';
  const sizeLabel = $('selectedVariantSizeLabel');
  if (sizeLabel) sizeLabel.textContent = activeProductVariant?.size || '';
  const label = $('variantCombinationLabel');
  if (label) label.textContent = variantCombinationLabel(selected);
  const priceElement = $('productCurrentPrice');
  if (priceElement) priceElement.textContent = isProductAvailableInCountry(product)
    ? displayCountryPrice(selected ? variantPriceForCountry(product, selected) : productPriceForCountry(product))
    : (currencyConfig().country === 'AZ' ? 'Not available for Azerbaijan' : 'Not available in this market');
  const compareElement = $('productComparePrice');
  const compareAt = compareAtPriceForCountry(product, selected);
  if (compareElement) compareElement.textContent = isProductAvailableInCountry(product) && compareAt != null ? displayCountryPrice(compareAt) : '';
  const badge = $('productDiscountBadge');
  if (badge && isProductSaleActive(product)) badge.textContent = `Save ${productDiscountPercent(product)}%`;
}
function selectProductVariantOption(dimension, value) {
  if (!activeProductVariant) return;
  const product = products.find(p => String(p.id) === String(activeProductVariant.productId));
  if (!product) return;
  const combinations = productVariantCombinations(product);
  const next = { ...activeProductVariant, [dimension]: value || null };
  if (!findVariantCombination(product, next.color, next.size)) {
    const fallback = combinations.find(v => dimension === 'color'
      ? normalizeVariantValue(v.color) === normalizeVariantValue(value)
      : normalizeVariantValue(v.size) === normalizeVariantValue(value));
    if (fallback) { next.color = fallback.color ?? null; next.size = fallback.size ?? null; }
  }
  activeProductVariant = next;
  updateProductVariantUI(product.id);
}
function productCartSelection(product) {
  const combinations = productVariantCombinations(product);
  if (combinations.length) {
    const combination = selectedProductVariantCombination(product);
    if (!combination) { showToast('Please select an available color and size.'); return null; }
    return {
      variant: variantCombinationLabel(combination),
      variantColor: combination.color ?? null,
      variantSize: combination.size ?? null
    };
  }
  const legacyVariant = $('modalRoot')?.querySelector('.variant.active')?.textContent.trim() || null;
  return { variant: legacyVariant, variantColor: null, variantSize: null };
}
function cartItemPrice(product, item) {
  const combination = (item.variantColor != null || item.variantSize != null)
    ? findVariantCombination(product, item.variantColor, item.variantSize) : null;
  return combination ? variantPriceForCountry(product, combination) : productPriceForCountry(product);
}
function cartItemVariantLabel(item) {
  if (item.variantColor != null || item.variantSize != null) {
    const az = localStorage.getItem('dg_language') === 'az';
    return [item.variantColor ? `${az ? 'Rəng' : 'Color'}: ${item.variantColor}` : '', item.variantSize ? `${az ? 'Ölçü' : 'Size'}: ${item.variantSize}` : ''].filter(Boolean).join(' · ');
  }
  return item.variant || '';
}

const PRODUCT_DESCRIPTION_HEADINGS = {
  'overview': 'overview',
  'description': 'overview',
  'product description': 'overview',
  'product details': 'overview',
  'key features': 'features',
  'key benefits': 'features',
  'features': 'features',
  'benefits': 'features',
  'specifications': 'Specifications',
  'technical specifications': 'Specifications',
  'product specifications': 'Specifications',
  'technical details': 'Specifications',
  'how to use': 'How to use',
  'usage instructions': 'How to use',
  "what's included": "What's included",
  'whats included': "What's included",
  'package contents': "What's included",
  'in the box': "What's included",
  'ingredients': 'Ingredients',
  'care instructions': 'Care instructions',
  'care & maintenance': 'Care instructions',
  'shipping info': 'Shipping information',
  'shipping information': 'Shipping information',
  'shipping & returns': 'Shipping & returns',
  'shipping and returns': 'Shipping & returns',
  'returns & refunds': 'Returns & refunds'
};
function normalizeDescriptionHeading(value) {
  return String(value || '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
}
function cleanDescriptionLines(lines) {
  let start = 0, end = lines.length;
  while (start < end && !String(lines[start]).trim()) start++;
  while (end > start && !String(lines[end - 1]).trim()) end--;
  return lines.slice(start, end);
}
function parseProductDescription(rawDescription) {
  const lines = String(rawDescription || '').replace(/\r/g, '').split('\n');
  const result = { overview: [], features: [], sections: [] };
  let target = result.overview;
  let foundSection = false;

  for (const line of lines) {
    const match = line.match(/^\s*([^:\n]{2,48})\s*:\s*$/);
    const normalized = match ? normalizeDescriptionHeading(match[1]) : '';
    const kind = normalized ? PRODUCT_DESCRIPTION_HEADINGS[normalized] : null;
    if (kind) {
      foundSection = true;
      if (kind === 'overview') {
        target = result.overview;
      } else if (kind === 'features') {
        target = result.features;
      } else {
        let section = result.sections.find(x => x.title.toLowerCase() === kind.toLowerCase());
        if (!section) {
          section = { title: kind, lines: [] };
          result.sections.push(section);
        }
        target = section.lines;
      }
      continue;
    }
    target.push(line);
  }

  result.overview = cleanDescriptionLines(result.overview);
  result.features = cleanDescriptionLines(result.features);
  result.sections = result.sections.map(section => ({ ...section, lines: cleanDescriptionLines(section.lines) })).filter(section => section.lines.some(line => String(line).trim()));

  // If the author didn't use recognized headings, keep all text together in
  // the overview instead of hiding or reordering anything they wrote.
  if (!foundSection) {
    result.overview = cleanDescriptionLines(lines);
    result.features = [];
    result.sections = [];
  }
  return result;
}
function isDescriptionBullet(line) {
  return /^\s*(?:[•·▪◦✓✔\-*–—]|\d+[.)])\s+/.test(String(line || ''));
}
function stripDescriptionBullet(line) {
  return String(line || '').replace(/^\s*(?:[•·▪◦✓✔\-*–—]|\d+[.)])\s+/, '').trim();
}
function renderProductDescriptionLines(lines, className = '') {
  const cleaned = cleanDescriptionLines(Array.isArray(lines) ? lines : []);
  if (!cleaned.length) return '';
  const blocks = [];
  let paragraph = [];
  const flush = () => {
    if (!paragraph.length) return;
    if (paragraph.every(line => isDescriptionBullet(line))) {
      blocks.push(`<ul class="product-description-list">${paragraph.map(line => `<li>${escapeHtml(stripDescriptionBullet(line))}</li>`).join('')}</ul>`);
    } else {
      blocks.push(`<p>${paragraph.map(line => escapeHtml(line.trim())).join('<br>')}</p>`);
    }
    paragraph = [];
  };
  cleaned.forEach(line => {
    if (!String(line).trim()) flush();
    else paragraph.push(String(line));
  });
  flush();
  return `<div class="${className}">${blocks.join('')}</div>`;
}
function renderProductFeatureList(lines) {
  const items = cleanDescriptionLines(Array.isArray(lines) ? lines : []).map(stripDescriptionBullet).filter(Boolean);
  if (!items.length) return '';
  return `<ul class="product-page-feature-list">${items.map(item => `<li><span class="product-feature-check" aria-hidden="true">✓</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>`;
}
function startProductSaleCountdown(product) {
  if (productSaleTimer) clearInterval(productSaleTimer);
  productSaleTimer = null;
  const endAt = Date.parse(product?.saleEndsAt || '');
  const countdown = $('productSaleCountdown');
  if (!countdown || !isProductSaleActive(product) || !Number.isFinite(endAt)) return;

  const update = () => {
    const left = endAt - Date.now();
    if (left <= 0) {
      if (productSaleTimer) clearInterval(productSaleTimer);
      productSaleTimer = null;
      const currentPrice = $('productCurrentPrice');
      if (productVariantCombinations(product).length) updateProductVariantUI(product.id);
      else if (currentPrice) currentPrice.textContent = displayCountryPrice(productPriceForCountry(product));
      $('productComparePrice')?.remove();
      $('productDiscountBadge')?.remove();
      $('productSaleOffer')?.remove();
      return;
    }
    const totalSeconds = Math.floor(left / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    countdown.textContent = `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };
  update();
  productSaleTimer = setInterval(update, 1000);
}
function saveAll() { localStorage.setItem('dg_wishlist', JSON.stringify([...state.wishlist])); localStorage.setItem('dg_cart', JSON.stringify(state.cart)); updateCounts(); }
function updateCounts() { $('wishCount').textContent = state.wishlist.size; $('cartCount').textContent = state.cart.reduce((n, x) => n + x.qty, 0); }
function showToast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.remove('hidden'); toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 2200); }
function heroCategoryImage(product) {
  if (!product) return '';
  const source = (Array.isArray(product.images) ? product.images.find(Boolean) : '') || product.image || '';
  return source ? String(source) : '';
}

function openHeroCategory(category) {
  setCategory(category);
}

function renderHeroProduct() {
  const grid = $('heroCategoryGrid');
  if (!grid) return;

  const categoryCards = [
    { key: 'Gadgets', overline: 'SMART LITTLE UPGRADES', title: 'Gadgets', description: 'Useful tech for everyday life', placeholder: '✧' },
    { key: 'Home', overline: 'MAKE IT YOUR SPACE', title: 'Home finds', description: 'Small touches for your space', placeholder: '⌂' },
    { key: 'Pet', overline: 'FOR YOUR COMPANIONS', title: 'Pet favorites', description: 'Find something for your best friend', placeholder: '🐾' }
  ];

  grid.innerHTML = categoryCards.map((category, index) => {
    const product = products.find(p => isProductAvailableInCountry(p) && String(p.category || '').trim().toLowerCase() === category.key.toLowerCase() && heroCategoryImage(p));
    const image = heroCategoryImage(product);
    const imageMarkup = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(category.title)} collection" loading="eager" decoding="async">`
      : `<span class="hero-category-placeholder" aria-hidden="true">${category.placeholder}</span>`;
    return `
      <button class="hero-category-card ${index === 0 ? 'hero-category-card-main' : ''}" type="button" onclick="openHeroCategory('${category.key}')" aria-label="Explore ${escapeHtml(category.title)}">
        <span class="hero-category-media">${imageMarkup}</span>
        <span class="hero-category-copy">
          <span class="hero-category-overline">${category.overline}</span>
          <span class="hero-category-title-row"><strong>${category.title}</strong><span class="hero-category-arrow" aria-hidden="true">↗</span></span>
          ${index === 0 ? `<span class="hero-category-description">${category.description}</span>` : ''}
        </span>
      </button>`;
  }).join('');
}

function renderProducts() { const q = ($('searchInput')?.value || '').trim().toLowerCase(); const sort = $('sortSelect')?.value || 'featured'; let list = products.filter(p => isProductAvailableInCountry(p) && (state.category === 'All' || p.category === state.category) && (!q || `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q))); if (sort === 'rating') list.sort((a, b) => b.rating - a.rating); if (sort === 'low') list.sort((a, b) => productPriceForCountry(a) - productPriceForCountry(b)); if (sort === 'high') list.sort((a, b) => productPriceForCountry(b) - productPriceForCountry(a)); $('shopTitle').textContent = state.category === 'All' ? 'Trending products' : `${state.category} products`; $('emptyResults').classList.toggle('hidden', list.length > 0); $('productGrid').innerHTML = list.map(cardHtml).join(''); document.querySelectorAll('.chip').forEach(ch => { const match = (ch.getAttribute('onclick') || '').match(/setCategory\('([^']+)'\)/); ch.classList.toggle('active', (match ? match[1] : ch.dataset.category) === state.category); }); renderHeroProduct(); }
function cardHtml(p) {
  const wished = state.wishlist.has(p.id);
  const image = (p.images && p.images.length) ? p.images[0] : (p.image || '');
  const saleActive = isProductSaleActive(p);
  const combinations = productVariantCombinations(p);
  const lowestCombination = combinations.length ? [...combinations].sort((a, b) => variantPriceForCountry(p, a) - variantPriceForCountry(p, b))[0] : null;
  const price = lowestCombination ? variantPriceForCountry(p, lowestCombination) : productPriceForCountry(p);
  const comparisonPrice = lowestCombination ? compareAtPriceForCountry(p, lowestCombination) : (saleActive ? compareAtPriceForCountry(p, null) : null);
  const discount = saleActive ? productDiscountPercent(p) : 0;
  // Show a rating only when backed by verified reviews returned by the server.
  const verifiedCount = Number(p.verifiedReviewCount || 0);
  const verifiedRating = Number(p.verifiedAverageRating || 0);
  const ratingMarkup = verifiedCount > 0 && Number.isFinite(verifiedRating)
    ? `<div class="product-rating">★ ${verifiedRating.toFixed(1)} · ${verifiedCount} reviews</div>`
    : '';
  const saleMarkup = saleActive && discount > 0
    ? `<span class="product-sale-badge">Save ${discount}%</span>`
    : '';

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(p.title)}" loading="lazy" onclick="openProduct(${p.id})" style="cursor:pointer">` : `<div class="product-image-placeholder">No image</div>`}
        ${p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ''}
        ${saleMarkup}
        <button class="wish-btn ${wished ? 'active' : ''}" aria-label="Toggle wishlist" onclick="toggleWishlist(${p.id})">${wished ? '♥' : '♡'}</button>
      </div>
      <div class="product-info">
        <div class="product-category">${escapeHtml(p.category || 'General')}</div>
        <div class="product-title" role="button" tabindex="0" onclick="openProduct(${p.id})" onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();openProduct(${p.id})}" style="cursor:pointer">${escapeHtml(p.title)}</div>
        ${ratingMarkup}
        <div class="product-bottom">
          <div class="price">
            ${combinations.length ? '<span class="price-from-label">From </span>' : ''}${displayCountryPrice(price)}
            ${saleActive && comparisonPrice != null ? `<span class="price-old">${displayCountryPrice(comparisonPrice)}</span>` : ''}
          </div>
          <button class="add-mini" onclick="quickAdd(${p.id})">${combinations.length || (p.variants && p.variants.length) ? 'Choose options' : 'Add'}</button>
        </div>
      </div>
    </article>`;
}
function setCategory(name) { state.category = name; renderProducts(); location.hash = 'shop'; }
function clearFilters() { state.category = 'All'; $('searchInput').value = ''; renderProducts(); }
function toggleSearch() { $('searchPanel').classList.toggle('hidden'); if (!$('searchPanel').classList.contains('hidden')) $('searchInput').focus(); }
$('searchInput').addEventListener('input', renderProducts);
function toggleMobileMenu() { $('mobileNav').classList.toggle('hidden'); }
function closeMobileMenu() { $('mobileNav').classList.add('hidden'); }
function goTop(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function toggleWishlist(id) { state.wishlist.has(id) ? state.wishlist.delete(id) : state.wishlist.add(id); saveAll(); renderProducts(); showToast(state.wishlist.has(id) ? 'Added to wishlist' : 'Removed from wishlist'); }
function openWishlist() { const list = products.filter(p => state.wishlist.has(p.id) && isProductAvailableInCountry(p)); $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>Wishlist</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${list.length ? `<div class="product-grid" style="grid-template-columns:repeat(2,1fr);padding:0">${list.map(cardHtml).join('')}</div>` : '<p class="muted">Your wishlist is empty.</p>'}</div></div>`; }
function quickAdd(id) { const product = products.find(p => String(p.id) === String(id)); if (!product) return; if (!isProductAvailableInCountry(product)) { showToast('This product is not available in your shipping country.'); return; } if (productVariantCombinations(product).length || (product.variants && product.variants.length)) { openProduct(id); return; } const item = state.cart.find(x => x.id === id && !x.variantColor && !x.variantSize && !x.variant); if (item) item.qty++; else state.cart.push({ id, qty: 1, variant: null, variantColor: null, variantSize: null }); saveAll(); showToast('Added to cart'); openCart(); }
function openProduct(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;

  if (!productPageOpen) productPageScrollY = window.scrollY || 0;
  const url = new URL(window.location.href);
  url.searchParams.set('product', String(p.id));
  // Keep advertising attribution parameters while making the product shareable.
  history.pushState({ dreamgrindProductId: String(p.id) }, '', `${url.pathname}${url.search}${url.hash}`);
  renderProductPage(p.id);
}

function renderProductPage(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;

  productPageOpen = true;
  document.title = `${p.title} | DreamGrind`;
  const availableInMarket = isProductAvailableInCountry(p);
  const marketConfig = currencyConfig();
  const images = (Array.isArray(p.images) && p.images.length) ? p.images : (p.image ? [p.image] : []);
  const mainImage = images[0] || '';
  const imageGallery = mainImage
    ? `<div class="main-product-media"><img id="mainProductImage" src="${escapeHtml(mainImage)}" alt="${escapeHtml(p.title)}"></div>`
    : '<div class="main-product-media"><div class="product-image-placeholder">Product image coming soon</div></div>';
  const thumbnails = images.length > 1
    ? `<div class="product-thumbnails" aria-label="Product images">${images.map((img, i) => `
        <button type="button" class="product-thumb ${i === 0 ? 'active' : ''}" aria-label="View image ${i + 1}" onclick="changeProductImage('${String(img).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', this)">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)} view ${i + 1}" loading="lazy">
        </button>`).join('')}</div>`
    : '';
  const video = p.video
    ? `<div class="product-video"><video controls playsinline preload="metadata"><source src="${escapeHtml(p.video)}" type="video/mp4">Your browser does not support video playback.</video></div>`
    : '';
  const combinations = productVariantCombinations(p);
  const variants = combinations.length
    ? renderProductVariantOptions(p)
    : (Array.isArray(p.variants) && p.variants.length
      ? `<div class="product-page-options"><label class="product-page-label">Choose option</label><div class="variant-row">${p.variants.map(v => `
          <button type="button" class="variant ${p.variants[0] === v ? 'active' : ''}" onclick="selectVariant(this)">${escapeHtml(v)}</button>`).join('')}</div></div>`
      : '');
  const parsedDescription = parseProductDescription(p.description || '');
  const overviewMarkup = renderProductDescriptionLines(parsedDescription.overview, 'product-page-description');
  const featureMarkup = renderProductFeatureList(parsedDescription.features);
  const hasCustomShipping = parsedDescription.sections.some(section => /shipping|returns/i.test(section.title));
  const extraSections = parsedDescription.sections.map(section => `
    <details class="product-page-accordion"><summary>${escapeHtml(section.title)}</summary>
      ${renderProductDescriptionLines(section.lines, 'product-page-accordion-content')}
    </details>`).join('');
  const shippingAccordion = hasCustomShipping ? '' : `
    <details class="product-page-accordion"><summary>Shipping &amp; returns</summary>
      <div class="product-page-accordion-content"><p>DreamGrind accepts orders for the United States, Canada, the United Kingdom and Azerbaijan. For Azerbaijan, only products with a confirmed final AZN price are available for normal checkout. The displayed price includes delivery and only those import or handling charges explicitly confirmed for that exact offer. DreamGrind does not promise DDP or prepaid customs for every order; any charge not clearly stated as included may be payable by the recipient. Please contact DreamGrind before returning an item so return instructions can be provided.</p></div>
    </details>`;
  const saleActive = isProductSaleActive(p);
  const discount = saleActive ? productDiscountPercent(p) : 0;
  const countdownEnd = Date.parse(p.saleEndsAt || '');
  const showCountdown = saleActive && Number.isFinite(countdownEnd) && countdownEnd > Date.now();
  const initialCombination = combinations.length ? selectedProductVariantCombination(p) : null;
  const currentPrice = initialCombination ? variantPriceForCountry(p, initialCombination) : productPriceForCountry(p);
  const initialCompareAt = initialCombination ? compareAtPriceForCountry(p, initialCombination) : compareAtPriceForCountry(p, null);
  const ratingCount = Number(p.reviews || 0);
  const ratingValue = Number(p.rating || 0);
  const ratingMarkup = ratingCount > 0 && Number.isFinite(ratingValue)
    ? `<div class="product-rating" aria-label="Rated ${ratingValue.toFixed(1)} out of 5"><span class="dg-rating-stars" aria-hidden="true">★★★★★</span> <strong>${ratingValue.toFixed(1)}</strong> <span class="product-page-reviews">(${ratingCount} verified reviews)</span></div>`
    : `<div class="dg-rating-proof"><span class="dg-rating-stars" aria-hidden="true">★★★★★</span><span>Be among the first verified customers to review this find.</span></div>`;
  const saleMarkup = saleActive
    ? `${discount > 0 ? `<span class="product-page-discount-badge" id="productDiscountBadge">Save ${discount}%</span>` : ''}<span class="price-old" id="productComparePrice">${displayCountryPrice(initialCompareAt ?? p.oldPrice)}</span>`
    : '';
  const benefitSource = Array.isArray(p.highlights) ? p.highlights : (Array.isArray(p.features) ? p.features : []);
  const benefitMarkup = benefitSource.filter(Boolean).slice(0,4).map((item,index) => `
    <div class="dg-benefit-item"><span class="dg-benefit-icon" aria-hidden="true">${['✦','✓','◈','↗'][index]}</span><span>${escapeHtml(String(item).replace(/<[^>]*>/g,' ').trim())}</span></div>`).join('');
  const safeBenefitMarkup = benefitMarkup || `
    <div class="dg-benefit-item"><span class="dg-benefit-icon">✓</span><span>Clear product information</span></div>
    <div class="dg-benefit-item"><span class="dg-benefit-icon">◇</span><span>Secure checkout</span></div>`;
  const paidUnits = Math.max(0, Number(p.unitsSold) || 0);
  const proofMarkup = paidUnits > 0
    ? `<span class="dg-proof-dot"></span><span>${paidUnits.toLocaleString()} ${paidUnits === 1 ? 'paid order' : 'paid orders'}</span>`
    : `<span class="dg-proof-dot dg-proof-dot-muted"></span><span>Thoughtfully selected by DreamGrind</span>`;
  const shippingLabel = marketConfig.country === 'AZ'
    ? 'Delivery and confirmed charges included in the displayed AZN price'
    : 'Shipping cost and delivery estimate shown at checkout';
  const priceMarkup = availableInMarket ? displayCountryPrice(currentPrice) : (marketConfig.country === 'AZ' ? 'Not yet listed for Azerbaijan' : 'Not available in this market');
  $('modalRoot').innerHTML = `
    <section class="product-page-overlay dg-product-page" aria-label="Product details">
      <header class="product-page-topbar">
        <div class="product-page-topbar-inner">
          <button class="product-page-back" type="button" onclick="closeProductPage()" aria-label="Back to shop">← <span>Back to shop</span></button>
          <a class="product-page-brand" href="/" onclick="event.preventDefault();closeProductPage();window.scrollTo({top:0,behavior:'smooth'})">DreamGrind<span>.</span></a>
          <button class="product-page-cart" type="button" onclick="closeProductPage();openCart()">Cart <span>${state.cart.reduce((n,x)=>n+x.qty,0)}</span></button>
        </div>
      </header>
      <div class="product-page-shell">
        <nav class="product-page-breadcrumb" aria-label="Breadcrumb"><a href="/" onclick="event.preventDefault();closeProductPage()">Home</a><span>›</span><a href="/#shop" onclick="event.preventDefault();closeProductPage();location.hash='shop'">Shop</a><span>›</span><span>${escapeHtml(p.title)}</span></nav>
        <div class="dg-product-intro">
          <div class="dg-product-gallery-column">
            <div class="dg-product-gallery-grid">
              <div class="dg-product-main-visual">${imageGallery}${saleActive ? '<span class="dg-image-badge">Special offer</span>' : ''}</div>
              <aside class="dg-product-visual-rail" aria-label="Product highlights">
                <div class="dg-visual-tile"><span>✦</span><strong>Useful</strong><small>Everyday find</small></div>
                <div class="dg-visual-tile"><span>◇</span><strong>Curated</strong><small>DreamGrind edit</small></div>
                <div class="dg-visual-tile"><span>✓</span><strong>Secure</strong><small>Epoint checkout</small></div>
              </aside>
            </div>
            ${thumbnails}
            ${video}
            ${images.length > 1 ? '<p class="dg-gallery-hint">Explore every angle and detail</p>' : ''}
          </div>
          <section class="product-page-info dg-product-info">
            <div class="dg-product-proof">${ratingMarkup}<div class="dg-proof-orders">${proofMarkup}</div></div>
            <div class="product-page-category">${escapeHtml(p.category || 'General')}</div>
            <h1 class="product-page-title">${escapeHtml(p.title)}</h1>
            <p class="dg-product-subtitle">${escapeHtml(String(p.shortDescription || p.tagline || '').trim() || 'A thoughtful find for everyday life.')}</p>
            <div class="dg-product-servings">${combinations.length ? 'Choose your preferred option' : 'Selected for useful everyday moments'}</div>
            <div class="product-page-price dg-product-price" id="productPriceBlock"><span id="productCurrentPrice">${priceMarkup}</span>${availableInMarket ? saleMarkup : ''}${discount > 0 ? `<span class="dg-save-pill">Save ${discount}%</span>` : ''}</div>
            ${showCountdown ? `<div class="product-page-sale-offer" id="productSaleOffer"><span>Limited-time offer ends in</span><strong id="productSaleCountdown" aria-live="off"></strong></div>` : ''}
            <div class="dg-product-benefits">${safeBenefitMarkup}</div>
            <div class="dg-shipping-line"><span class="dg-proof-dot"></span><span>${escapeHtml(shippingLabel)}</span></div>
            <div class="dg-stock-line">${availableInMarket ? 'Available for your selected delivery country' : 'Not available for this delivery country'}</div>
            ${availableInMarket ? '' : `<div class="note-box" role="status">This product is not available for delivery to ${escapeHtml(marketConfig.country)}.</div>`}
            ${featureMarkup}
            ${variants}
            <div class="product-page-quantity"><label for="detailQty" class="product-page-label">Quantity</label><input id="detailQty" type="number" min="1" max="20" value="1" inputmode="numeric"></div>
            <div class="detail-actions product-page-desktop-actions">
              <button class="primary-button full dg-add-button" type="button" onclick="addProductFromDetail(${p.id})" ${availableInMarket?'':'disabled'}>Add to cart</button>
              <button class="buy-now-button full dg-buy-button" type="button" onclick="buyNowFromDetail(${p.id})" ${availableInMarket?'':'disabled'}>Buy now <span aria-hidden="true">→</span></button>
            </div>
            <div class="dg-trust-mini"><span>✓ Secure Epoint payment</span><span>✓ Guest checkout</span><span>✓ Direct customer support</span></div>
            ${overviewMarkup ? `<section class="product-page-details-text"><h2 class="product-page-section-title">Product details</h2>${overviewMarkup}</section>` : ''}
            ${(extraSections || shippingAccordion) ? `<section class="product-page-accordions" aria-label="More product information">${extraSections}${shippingAccordion}</section>` : ''}
          </section>
        </div>
        <section class="dg-product-story">
          <div class="dg-story-image">${images.length > 1 ? `<img src="${escapeHtml(images[1])}" alt="${escapeHtml(p.title)} product detail" loading="lazy">` : (mainImage ? `<img src="${escapeHtml(mainImage)}" alt="${escapeHtml(p.title)}" loading="lazy">` : '')}</div>
          <div class="dg-story-copy"><p class="eyebrow">THE DREAMGRIND EDIT</p><h2>Good finds make everyday better.</h2><p>${escapeHtml(String(p.shortDescription || p.tagline || p.description || 'Discover a practical detail, a thoughtful design and a better everyday experience.').replace(/<[^>]*>/g,' ').slice(0,420))}</p><div class="dg-story-stats"><span><strong>01</strong> Thoughtful design</span><span><strong>02</strong> Clear details</span><span><strong>03</strong> Easy checkout</span></div></div>
        </section>
        <section class="dg-product-media-strip">
          <div class="dg-media-heading"><div><p class="eyebrow">SEE THE DETAILS</p><h2>Explore this find</h2></div><span>${images.length} product views</span></div>
          <div class="dg-media-grid">${images.slice(0,6).map((img,index)=>`<button type="button" class="dg-media-card" onclick="changeProductImage('${String(img).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}', document.querySelector('.product-thumb:nth-child(${index+1})'))"><img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)} view ${index+1}" loading="lazy"></button>`).join('')}${video ? '<div class="dg-media-video-note">Product video available above</div>' : ''}</div>
        </section>
      </div>
      <div class="product-page-sticky-actions" aria-label="Purchase actions">
        <button class="product-page-mobile-add" type="button" onclick="addProductFromDetail(${p.id})" ${availableInMarket?'':'disabled'}>Add to cart</button>
        <button class="product-page-mobile-buy" type="button" onclick="buyNowFromDetail(${p.id})" ${availableInMarket?'':'disabled'}>Buy now →</button>
      </div>
    </section>`;

  const page = $('modalRoot').querySelector('.product-page-overlay');
  if (page) page.scrollTop = 0;
  if (combinations.length) {
    $('modalRoot').querySelectorAll('[data-variant-dimension]').forEach(button => {
      button.addEventListener('click', () => selectProductVariantOption(button.dataset.variantDimension, button.dataset.variantValue));
    });
    updateProductVariantUI(p.id);
  }
  startProductSaleCountdown(p);
}
function dismissProductPage(updateUrl = true) {
  if (productSaleTimer) clearInterval(productSaleTimer);
  productSaleTimer = null;
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  if ($('modalRoot')?.querySelector('.product-page-overlay')) $('modalRoot').innerHTML = '';
  productPageOpen = false;
  document.title = localStorage.getItem('dg_language') === 'az' ? 'DreamGrind — Ağıllı alış-veriş burada başlayır' : originalDocumentTitle;
  window.scrollTo({ top: Math.max(0, productPageScrollY), behavior: 'auto' });
}

function closeProductPage() {
  dismissProductPage(true);
}

function changeProductImage(src, button) {
  const main = $('mainProductImage');
  if (!main) return;

  main.src = src;

  document
    .querySelectorAll('.product-thumb')
    .forEach(x => x.classList.remove('active'));

  button.classList.add('active');
}
function selectVariant(button) { button.parentElement.querySelectorAll('.variant').forEach(x => x.classList.remove('active')); button.classList.add('active'); }
function addProductFromDetail(id) {
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;
  if (!isProductAvailableInCountry(product)) { showToast('This product is not available in your shipping country.'); return; }
  const selection = productCartSelection(product);
  if (!selection) return;
  const qty = Math.max(1, Math.min(20, Number($('detailQty')?.value) || 1));
  const usesDimensionVariant = selection.variantColor != null || selection.variantSize != null;
  const item = state.cart.find(x => Number(x.id) === Number(id) && (
    usesDimensionVariant
      ? normalizeVariantValue(x.variantColor) === normalizeVariantValue(selection.variantColor) && normalizeVariantValue(x.variantSize) === normalizeVariantValue(selection.variantSize)
      : x.variantColor == null && x.variantSize == null && (x.variant || null) === (selection.variant || null)
  ));
  if (item) item.qty += qty;
  else state.cart.push({ id: Number(id), qty, variant: selection.variant, variantColor: selection.variantColor, variantSize: selection.variantSize });
  saveAll(); showToast('Added to cart');
  if (productPageOpen) dismissProductPage(true); else closeModal();
  openCart();
}
function buyNowFromDetail(id) {
  const product = products.find(x => String(x.id) === String(id));
  if (!product) return;
  if (!isProductAvailableInCountry(product)) { showToast('This product is not available in your shipping country.'); return; }
  const selection = productCartSelection(product);
  if (!selection) return;
  const qty = Math.max(1, Math.min(20, Number($('detailQty')?.value) || 1));
  if (productPageOpen) dismissProductPage(true);
  startCheckout([{ id: Number(product.id), qty, ...selection }]);
}
function cartSubtotal() {
  return state.cart.reduce((sum, item) => {
    const product = products.find(p => Number(p.id) === Number(item.id));
    if (!product || !isProductAvailableInCountry(product)) return sum;
    return sum + cartItemPrice(product, item) * item.qty;
  }, 0);
}
function shippingCost() { return 0; }
function dgAnalyticsItemsFor(items) {
  return (Array.isArray(items) ? items : []).map(item => {
    const product = products.find(p => Number(p.id) === Number(item.id));
    if (!product) return null;
    const price = Number(cartItemPrice(product, item));
    const variantParts = [item.variantColor, item.variantSize, item.variant].filter(Boolean);
    return { item_id: String(product.id), item_name: String(product.title || 'DreamGrind product').slice(0, 100), item_category: String(product.category || 'General').slice(0, 80), ...(variantParts.length ? { item_variant: variantParts.join(' / ').slice(0, 100) } : {}), price: Number((Number.isFinite(price) ? price : 0).toFixed(2)), quantity: Math.max(1, Number(item.qty) || 1) };
  }).filter(Boolean);
}
function dgAnalyticsValueFor(items) {
  const config = currencyConfig();
  const gaItems = dgAnalyticsItemsFor(items);
  return { currency: config.currency, value: Number(gaItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)), items: gaItems };
}
function openCart() {
  const c = currencyConfig();
  const lines = state.cart.length ? state.cart.map(item => {
    const p = products.find(product => Number(product.id) === Number(item.id));
    if (!p) return '';
    const available = isProductAvailableInCountry(p);
    const unitPrice = available ? cartItemPrice(p, item) : 0;
    const optionLabel = cartItemVariantLabel(item);
    const priceLabel = available ? `${displayCountryPrice(unitPrice)} each` : (c.country === 'AZ' ? 'Not yet listed for Azerbaijan' : 'Not available for this destination');
    const lineTotal = available ? displayCountryPrice(unitPrice * item.qty) : '—';
    return `<div class="cart-line"><img src="${(p.images && p.images.length) ? p.images[0] : (p.image || '')}" alt="${escapeHtml(p.title)}"><div><strong>${escapeHtml(p.title)}</strong><div class="muted">${optionLabel ? `${localStorage.getItem('dg_language') === 'az' ? 'Seçim' : 'Option'}: ${escapeHtml(optionLabel)} · ` : ''}${priceLabel}</div><div class="qty-control"><button onclick="changeQty(${p.id},'${encodeURIComponent(item.variant || '')}',-1)">−</button><span>${item.qty}</span><button onclick="changeQty(${p.id},'${encodeURIComponent(item.variant || '')}',1)">+</button></div></div><strong>${lineTotal}</strong></div>`;
  }).join('') : `<p class="muted">Your cart is empty.</p>`;
  const sub = cartSubtotal();
  const ship = state.cart.length ? shippingCost() : 0;
  const total = sub + ship;
  const isAz = c.country === 'AZ';
  const langAz = localStorage.getItem('dg_language') === 'az';
  $('modalRoot').innerHTML = `<div class="overlay" onclick="closeModal(event)"><aside class="drawer"><div class="drawer-head"><h2>Your cart</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${lines}<div class="drawer-section"><label for="countrySelect">Shipping country</label><select id="countrySelect" onchange="setCountry(this.value)"><option value="US" ${c.country === 'US' ? 'selected' : ''}>United States</option><option value="CA" ${c.country === 'CA' ? 'selected' : ''}>Canada</option><option value="UK" ${c.country === 'UK' ? 'selected' : ''}>United Kingdom</option><option value="AZ" ${c.country === 'AZ' ? 'selected' : ''}>Azerbaijan</option></select></div><div class="summary-row"><span>Subtotal</span><span>${displayCountryPrice(sub)}</span></div><div class="summary-row"><span>Shipping</span><span>${isAz ? (langAz ? 'Daxildir' : 'Included') : (ship === 0 ? 'FREE' : displayCountryPrice(ship))}</span></div><div class="summary-row total"><span>Total</span><span>${displayCountryPrice(total)}</span></div><button class="primary-button full" onclick="startCheckout()" ${state.cart.length ? '' : 'disabled'}>Checkout</button><div class="note-box" style="margin-top:12px">${isAz ? (langAz ? 'Göstərilən AZN qiymətinə çatdırılma və həmin təklif üçün təsdiqlənmiş müvafiq xərclər daxildir. Epoint ilə təhlükəsiz ödəniş.' : 'The displayed AZN price includes delivery and applicable charges confirmed for this offer. Secure payment by Epoint.') : 'You will be charged in AZN. Secure payment by Epoint.'}</div></aside></div>`;
}
function changeQty(id, variantKey, delta) {
  const variant = decodeURIComponent(variantKey);
  const item = state.cart.find(x => Number(x.id) === Number(id) && (x.variant || '') === variant);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(x => x !== item);
  saveAll(); openCart();
}
async function startCheckout(items = null) {
  await refreshStoreConfig();
  const sourceItems = Array.isArray(items) ? items : state.cart;
  const checkoutItems = sourceItems
    .map(item => ({ id: Number(item.id), qty: Math.max(1, Math.min(20, Number(item.qty) || 1)), variant: item.variant ?? null, variantColor: item.variantColor ?? null, variantSize: item.variantSize ?? null }))
    .filter(item => Number.isInteger(item.id) && item.id > 0 && item.qty > 0);
  const staleVariant = checkoutItems.find(item => {
    const product = products.find(p => Number(p.id) === item.id);
    return productVariantCombinations(product).length && item.variantColor == null && item.variantSize == null;
  });
  if (staleVariant) {
    showToast('Please remove the outdated item from your cart and select its color/size again.');
    return;
  }

  if (!checkoutItems.length) {
    showToast('Your cart is empty');
    return;
  }
  const unavailableItem = checkoutItems.find(item => {
    const product = products.find(p => Number(p.id) === Number(item.id));
    return !product || !isProductAvailableInCountry(product);
  });
  if (unavailableItem) {
    showToast('One or more products are not available for the selected destination.');
    return;
  }

  // Keep a snapshot so Buy now purchases only the selected product.
  // Remember checkout mode across the Epoint redirect, so a Buy now payment
  // never clears other items already saved in the customer's cart.
  pendingCheckoutItems = checkoutItems;
  window.DGAnalytics?.track('begin_checkout', dgAnalyticsValueFor(checkoutItems));
  sessionStorage.setItem('dg_checkout_mode', Array.isArray(items) ? 'buy-now' : 'cart');

  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.warn('Unable to check account session; continuing as guest.', error);
  }

  const c = currencyConfig();
  $('modalRoot').innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head">
          <h2>Checkout</h2>
          <button class="close-btn" onclick="closeModal()">✕</button>
        </div>

        <p class="muted" style="margin-top:0">Checkout as a guest. No account is required. Enter your contact and delivery details to continue to secure payment.</p>

        <form class="form-grid" onsubmit="submitDemoOrder(event)">
          <label>
            <span id="coNameLabel">Full name</span>
            <input id="coName" name="name" autocomplete="name" required value="${escapeHtml(user?.name || '')}">
          </label>

          <label>
            <span id="coEmailLabel">Email</span>
            <input id="coEmail" name="email" type="email" autocomplete="email" required value="${escapeHtml(user?.email || '')}">
          </label>

          <label>
            <span id="coPhoneLabel">Mobile number</span>
            <div class="phone-input-row">
              <span class="phone-input-prefix" id="coPhonePrefix" aria-label="Country calling code">${c.country === 'AZ' ? '+994' : c.country === 'UK' ? '+44' : '+1'}</span>
              <input id="coPhone" name="tel-national" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="18" required placeholder="${c.country === 'AZ' ? '50 123 45 67' : c.country === 'UK' ? '7700 900123' : c.country === 'CA' ? '416 555 0123' : '202 555 0123'}" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
            </div>
            <small class="checkout-field-help" id="coPhoneHelp">The country code is added automatically.</small>
          </label>

          <label>
            <span id="coCountryLabel">Country</span>
            <select id="coCountry" name="country" autocomplete="country-name" required data-last-country="${c.country === 'US' ? 'United States' : c.country === 'CA' ? 'Canada' : c.country === 'UK' ? 'United Kingdom' : 'Azerbaijan'}" onchange="handleCheckoutCountryChange()">
              <option value="United States" ${c.country === 'US' ? 'selected' : ''}>United States</option>
              <option value="Canada" ${c.country === 'CA' ? 'selected' : ''}>Canada</option>
              <option value="United Kingdom" ${c.country === 'UK' ? 'selected' : ''}>United Kingdom</option>
              <option value="Azerbaijan" ${c.country === 'AZ' ? 'selected' : ''}>Azerbaijan</option>
            </select>
            <small class="checkout-field-help">Choose the delivery destination first. The address fields will adjust to this country.</small>
          </label>

          <label>
            <span id="coAddressLabel">Address</span>
            <input id="coAddress" name="street-address" autocomplete="street-address" required placeholder="Street address">
          </label>

          <label>
            <span id="coAddressLine2Label">Address details (optional)</span>
            <input id="coAddressLine2" name="address-line2" autocomplete="address-line2" placeholder="Apartment, building, entrance">
          </label>

          <label>
            <span id="coCityLabel">City / Town</span>
            <input id="coCity" name="address-level2" autocomplete="address-level2" required placeholder="City or town">
          </label>

          <label>
            <span id="coStateLabel">${c.country === 'UK' ? 'County (optional)' : c.country === 'CA' ? 'Province / Territory *' : c.country === 'AZ' ? 'Rayon / district *' : 'State *'}</span>
            <input id="coState" name="address-level1" autocomplete="address-level1" ${c.country === 'UK' ? '' : 'required'} aria-required="${c.country === 'UK' ? 'false' : 'true'}" placeholder="${c.country === 'UK' ? 'County, if applicable' : c.country === 'CA' ? 'e.g. Ontario' : c.country === 'AZ' ? 'e.g. Yasamal' : 'e.g. California'}">
            <small class="checkout-field-help" id="coStateHelp">${c.country === 'UK' ? 'County is optional for most UK delivery addresses.' : c.country === 'CA' ? 'Enter the province or territory for the delivery address.' : c.country === 'AZ' ? 'Enter the rayon or administrative area.' : 'Enter the state for the delivery address.'}</small>
          </label>

          <label>
            <span id="coZipLabel">${c.country === 'UK' ? 'Postcode *' : c.country === 'CA' ? 'Postal code *' : c.country === 'AZ' ? 'Postal code *' : 'ZIP code *'}</span>
            <input id="coZip" name="postal-code" autocomplete="postal-code" autocapitalize="characters" required aria-required="true" placeholder="${c.country === 'UK' ? 'e.g. SW1A 1AA' : c.country === 'CA' ? 'e.g. K1A 0B1' : c.country === 'AZ' ? 'e.g. AZ1000' : 'e.g. 90210'}">
            <small class="checkout-field-help" id="coZipHelp">${c.country === 'UK' ? 'Enter the UK postcode as provided by the recipient.' : c.country === 'CA' ? 'Enter the Canadian postal code, including the space if shown.' : c.country === 'AZ' ? 'Enter the Azerbaijan postal code for the delivery address.' : 'Enter the ZIP code for the delivery address.'}</small>
          </label>

          <label class="full">
            <span id="coDeliveryNotesLabel">Delivery notes (optional)</span>
            <textarea id="coDeliveryNotes" name="delivery-notes" maxlength="500" placeholder="Landmark or instructions for the courier"></textarea>
          </label>
          <section class="checkout-order-summary full" id="checkoutOrderSummary" aria-live="polite">
            <h3>Order summary</h3>
            <div id="checkoutOrderLines"></div>
            <div class="summary-row"><span>Subtotal</span><strong id="checkoutSubtotal">—</strong></div>
            <div class="summary-row"><span>Shipping</span><strong id="checkoutShipping">—</strong></div>
            <div class="summary-row total"><span>Total</span><strong id="checkoutTotal">—</strong></div>
            <p class="muted" id="checkoutCurrencyNote">Final amount is confirmed before secure payment.</p>
          </section>
                    <p class="checkout-country-message full" id="checkoutCountryMessage" role="status" aria-live="polite"></p>
          <div class="note-box full" id="checkoutPaymentNote">${c.country === 'AZ' ? (localStorage.getItem('dg_language') === 'az' ? 'Göstərilən AZN qiymətinə çatdırılma və həmin təklif üçün təsdiqlənmiş müvafiq xərclər daxildir. Ödəniş Epoint vasitəsilə təhlükəsiz həyata keçirilir.' : 'The displayed AZN price includes delivery and applicable charges confirmed for this offer. Payment is processed securely through Epoint.') : 'You will be charged in AZN. Secure payment by Epoint.'}</div>
          <button id="coSubmitButton" class="primary-button full" type="submit">${localStorage.getItem('dg_language') === 'az' ? 'Təhlükəsiz ödənişə keç' : 'Continue to secure payment'}</button>
        </form>
      </div>
    </div>`;
  const checkoutCountrySelect = $('coCountry');
  if (checkoutCountrySelect) checkoutCountrySelect.dataset.lastCountry = checkoutCountrySelect.value;
  updateCheckoutAddressFields();
  renderCheckoutOrderSummary();
  if (c.country === 'AZ' && $('checkoutCountryMessage')) {
    $('checkoutCountryMessage').textContent = localStorage.getItem('dg_language') === 'az'
      ? 'Bu məhsul üçün yekun AZN qiymətinə çatdırılma və təsdiqlənmiş müvafiq xərclər daxildir. Ödənişi Epoint vasitəsilə saytda tamamlayacaqsınız.'
      : 'The final AZN price for this product includes delivery and confirmed applicable charges. Complete payment on the website through Epoint.';
  }
  if (c.country !== 'AZ' && $('checkoutCountryMessage')) {
    const activeCheckoutItems = pendingCheckoutItems?.length ? pendingCheckoutItems : state.cart;
    const aznTotal = activeCheckoutItems.reduce((sum, item) => {
      const product = products.find(p => Number(p.id) === Number(item.id));
      if (!product) return sum;
      const selectedMarketPrice = Number(item.price ?? productPriceForCountry(product));
      const marketToAzn = c.country === 'CA' ? 1.36 : c.country === 'UK' ? 0.75 : 1.70;
      return sum + selectedMarketPrice * Number(item.qty || 1) * marketToAzn;
    }, 0);
    $('checkoutCountryMessage').textContent = localStorage.getItem('dg_language') === 'az'
      ? 'Epoint ödənişi AZN ilə emal edir. Kartınızdan təxmini ' + new Intl.NumberFormat('az-AZ',{style:'currency',currency:'AZN'}).format(aznTotal) + ' AZN tutulacaq. Bankınızın yekun məzənnəsi fərqli ola bilər.'
      : 'Epoint processes payments in AZN. Your card will be charged approximately ' + new Intl.NumberFormat('en-US',{style:'currency',currency:'AZN'}).format(aznTotal) + ' AZN. Your bank may apply its own exchange rate.';
  }
}

function updateCheckoutAddressFields() {
  const country = $('coCountry')?.value || 'United States';
  const stateLabel = $('coStateLabel');
  const stateInput = $('coState');
  const stateHelp = $('coStateHelp');
  const zipLabel = $('coZipLabel');
  const zipInput = $('coZip');
  const zipHelp = $('coZipHelp');
  const phoneInput = $('coPhone');
  const phonePrefix = $('coPhonePrefix');
  const phoneHelp = $('coPhoneHelp');
  const isAzLanguage = localStorage.getItem('dg_language') === 'az';
  const fieldLabelTranslations = { 'ZIP code *': 'Poçt indeksi *', 'Postal code *': 'Poçt indeksi *', 'Postcode *': 'Poçt indeksi *' };
  const localize = value => isAzLanguage ? (fieldLabelTranslations[value] || translateUiText(value, 'az')) : value;

  const rules = {
    'United States': {
      stateLabel: 'State *', statePlaceholder: 'e.g. California', stateRequired: true,
      stateHelp: 'Enter the state for the delivery address.',
      zipLabel: 'ZIP code *', zipPlaceholder: 'e.g. 90210', zipRequired: true,
      zipHelp: 'Enter the ZIP code for the delivery address.'
    },
    'Canada': {
      stateLabel: 'Province / Territory *', statePlaceholder: 'e.g. Ontario', stateRequired: true,
      stateHelp: 'Enter the province or territory for the delivery address.',
      zipLabel: 'Postal code *', zipPlaceholder: 'e.g. K1A 0B1', zipRequired: true,
      zipHelp: 'Enter the Canadian postal code, including the space if shown.'
    },
    'United Kingdom': {
      stateLabel: 'County (optional)', statePlaceholder: 'County, if applicable', stateRequired: false,
      stateHelp: 'County is optional for most UK delivery addresses.',
      zipLabel: 'Postcode *', zipPlaceholder: 'e.g. SW1A 1AA', zipRequired: true,
      zipHelp: 'Enter the UK postcode as provided by the recipient.'
    },
    'Azerbaijan': {
      stateLabel: 'Rayon / district *', statePlaceholder: 'e.g. Yasamal', stateRequired: true,
      stateHelp: 'Enter the rayon or administrative area for the delivery address.',
      zipLabel: 'Postal code *', zipPlaceholder: 'e.g. AZ1000', zipRequired: true,
      zipHelp: 'Enter the Azerbaijan postal code for the delivery address.'
    }
  };

  const phoneRules = {
    'United States': { prefix: '+1', placeholder: '202 555 0123', en: 'Enter the 10-digit number. +1 is added automatically.', az: '10 rəqəmli nömrəni daxil edin. +1 avtomatik əlavə olunur.' },
    'Canada': { prefix: '+1', placeholder: '416 555 0123', en: 'Enter the 10-digit number. +1 is added automatically.', az: '10 rəqəmli nömrəni daxil edin. +1 avtomatik əlavə olunur.' },
    'United Kingdom': { prefix: '+44', placeholder: '7700 900123', en: 'Enter 9–10 digits. You may include the first 0; +44 is added automatically.', az: '9–10 rəqəm daxil edin. İlk 0 rəqəmini yaza bilərsiniz; +44 avtomatik əlavə olunur.' },
    'Azerbaijan': { prefix: '+994', placeholder: '50 123 45 67', en: 'Enter 9 digits. You may include the first 0; +994 is added automatically.', az: '9 rəqəm daxil edin. İlk 0 rəqəmini yaza bilərsiniz; +994 avtomatik əlavə olunur.' }
  };

  const rule = rules[country] || rules['United States'];
  const phoneRule = phoneRules[country] || phoneRules['United States'];
  const labels = {
    coNameLabel: 'Full name', coEmailLabel: 'Email', coPhoneLabel: 'Mobile number',
    coCountryLabel: 'Country', coAddressLabel: 'Address',
    coAddressLine2Label: 'Address details (optional)', coCityLabel: 'City / Town',
    coDeliveryNotesLabel: 'Delivery notes (optional)'
  };
  for (const [id, value] of Object.entries(labels)) {
    const node = $(id);
    if (node) node.textContent = localize(value);
  }

  if (stateLabel) stateLabel.textContent = localize(rule.stateLabel);
  if (stateInput) {
    stateInput.placeholder = localize(rule.statePlaceholder);
    stateInput.required = rule.stateRequired;
    stateInput.setAttribute('aria-required', String(rule.stateRequired));
  }
  if (stateHelp) stateHelp.textContent = localize(rule.stateHelp);

  if (zipLabel) zipLabel.textContent = localize(rule.zipLabel);
  if (zipInput) {
    zipInput.placeholder = localize(rule.zipPlaceholder);
    zipInput.required = rule.zipRequired !== false;
    zipInput.setAttribute('aria-required', String(zipInput.required));
    zipInput.autocapitalize = 'characters';
  }
  if (zipHelp) zipHelp.textContent = localize(rule.zipHelp);

  if (phonePrefix) phonePrefix.textContent = phoneRule.prefix;
  if (phoneInput) {
    phoneInput.placeholder = phoneRule.placeholder;
    phoneInput.inputMode = 'numeric';
    phoneInput.autocomplete = 'tel-national';
    phoneInput.maxLength = 18;
    phoneInput.setAttribute('pattern', '[0-9]{7,18}');
  }
  if (phoneHelp) phoneHelp.textContent = isAzLanguage ? phoneRule.az : phoneRule.en;
}

function normalizeCheckoutPhone(country, value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (country === 'Azerbaijan') {
    if (digits.startsWith('994')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return /^\d{9}$/.test(digits) ? `+994${digits}` : null;
  }

  if (country === 'United States' || country === 'Canada') {
    if (digits.startsWith('1') && digits.length === 11) digits = digits.slice(1);
    return /^\d{10}$/.test(digits) ? `+1${digits}` : null;
  }

  if (country === 'United Kingdom') {
    if (digits.startsWith('44')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return /^\d{9,10}$/.test(digits) ? `+44${digits}` : null;
  }

  return null;
}

function checkoutPhoneError(country, isAzLanguage) {
  if (country === 'Azerbaijan') return isAzLanguage
    ? '9 rəqəmli Azərbaycan mobil nömrəsi daxil edin. +994 avtomatik əlavə olunur.'
    : 'Enter 9 Azerbaijan mobile digits. A leading 0 is optional; +994 is added automatically.';
  if (country === 'United Kingdom') return isAzLanguage
    ? '9–10 rəqəmli Britaniya nömrəsi daxil edin. +44 avtomatik əlavə olunur.'
    : 'Enter 9 or 10 UK phone digits. A leading 0 is optional; +44 is added automatically.';
  return isAzLanguage
    ? '10 rəqəmli ABŞ/Kanada nömrəsi daxil edin. +1 avtomatik əlavə olunur.'
    : 'Enter a 10-digit US or Canadian phone number. +1 is added automatically.';
}
function renderCheckoutOrderSummary() {
  const root = $('checkoutOrderSummary');
  const linesNode = $('checkoutOrderLines');
  if (!root || !linesNode) return;
  const items = pendingCheckoutItems?.length ? pendingCheckoutItems : state.cart;
  const country = $('coCountry')?.value || 'United States';
  const code = ({ 'United States':'US', Canada:'CA', 'United Kingdom':'UK', Azerbaijan:'AZ' })[country] || 'US';
  const currency = ({US:'USD',CA:'CAD',UK:'GBP',AZ:'AZN'})[code];
  const formatter = new Intl.NumberFormat(code === 'AZ' ? 'az-AZ' : (code === 'UK' ? 'en-GB' : code === 'CA' ? 'en-CA' : 'en-US'), {style:'currency',currency});
  const availableItems = [];
  let unavailable = false;
  for (const item of items) {
    const product = products.find(entry => Number(entry.id) === Number(item.id));
    if (!product || !isProductAvailableInCountry(product, code)) {
      unavailable = true;
      const unknownTitle = product?.title || 'Unavailable product';
      availableItems.push({title:unknownTitle,qty:Number(item.qty)||1,price:null,variant:item.variantColor || item.variantSize ? [item.variantColor,item.variantSize].filter(Boolean).join(' / ') : item.variant || ''});
      continue;
    }
    const price = Number(cartItemPrice(product, item));
    availableItems.push({title:product.title,qty:Math.max(1,Number(item.qty)||1),price:Number.isFinite(price)&&price>0?price:0,variant:item.variantColor || item.variantSize ? [item.variantColor,item.variantSize].filter(Boolean).join(' / ') : item.variant || ''});
  }
  const subtotal = availableItems.reduce((sum,item)=>sum+(item.price == null ? 0 : item.price*item.qty),0);
  const rows = availableItems.map(item => {
    const option = item.variant ? '<small class="muted">'+escapeHtml(item.variant)+'</small>' : '';
    const amount = item.price == null ? 'Unavailable for this destination' : formatter.format(item.price*item.qty);
    return '<div class="checkout-order-line"><span>'+escapeHtml(item.title)+' × '+item.qty+option+'</span><strong>'+escapeHtml(amount)+'</strong></div>';
  }).join('');
  linesNode.innerHTML = rows || '<p class="muted">Your cart is empty.</p>';
  if ($('checkoutSubtotal')) $('checkoutSubtotal').textContent = formatter.format(subtotal);
  if ($('checkoutShipping')) $('checkoutShipping').textContent = code === 'AZ' ? (localStorage.getItem('dg_language') === 'az' ? 'Daxildir' : 'Included') : formatter.format(0);
  if ($('checkoutTotal')) $('checkoutTotal').textContent = formatter.format(subtotal);
  if ($('checkoutCurrencyNote')) $('checkoutCurrencyNote').textContent = code === 'AZ'
    ? (localStorage.getItem('dg_language') === 'az' ? 'Çatdırılma bu məhsullar üçün təsdiqlənmiş yekun AZN qiymətinə daxildir. Epoint ödənişi təhlükəsiz şəkildə AZN ilə həyata keçirir.' : 'Delivery is included in the confirmed final AZN prices for these products. Epoint processes the payment securely in AZN.')
    : (localStorage.getItem('dg_language') === 'az' ? 'Məbləğ seçilmiş bazarın valyutasında göstərilir. Epoint ödənişi AZN ilə həyata keçirir; ödənişə keçməzdən əvvəl yekun məbləğ göstərilir.' : 'Prices are displayed in the selected market currency. Epoint processes payment in AZN; the final amount is confirmed before payment.');
  const button = $('coSubmitButton');
  if (button && unavailable) {
    button.disabled = true;
    button.title = 'Remove products unavailable in the selected destination.';
  } else if (button && !button.dataset.submitting) {
    button.disabled = false;
    button.title = '';
  }
}

function handleCheckoutCountryChange() {
  const select = $('coCountry');
  if (!select) return;

  const previousCountry = select.dataset.lastCountry || select.value;
  const nextCountry = select.value;

  if (previousCountry !== nextCountry) {
    if ($('coState')) $('coState').value = '';
    if ($('coZip')) $('coZip').value = '';
    if ($('coPhone')) $('coPhone').value = '';
    const message = $('checkoutCountryMessage');
    if (message) message.textContent = localStorage.getItem('dg_language') === 'az'
      ? 'Ölkə dəyişdirildi. Rayon və poçt indeksini yenidən yoxlayın.'
      : 'Country changed. Please confirm the region and postal code for the new destination.';
  }

  select.dataset.lastCountry = nextCountry;
  const countryCodes = { 'United States': 'US', 'Canada': 'CA', 'United Kingdom': 'UK', 'Azerbaijan': 'AZ' };
  localStorage.setItem('dg_country', countryCodes[nextCountry] || 'US');
  syncCountryPicker();
  renderProducts();
  updateCheckoutAddressFields();
  const code = countryCodes[nextCountry] || 'US';
  const checkoutButton = $('coSubmitButton');
  if (checkoutButton) {
    checkoutButton.disabled = false;
    checkoutButton.textContent = localStorage.getItem('dg_language') === 'az' ? 'Təhlükəsiz ödənişə keç' : 'Continue to secure payment';
  }
  const paymentNote = $('checkoutPaymentNote');
  if (paymentNote) paymentNote.textContent = code === 'AZ'
    ? (localStorage.getItem('dg_language') === 'az' ? 'Göstərilən AZN qiymətinə çatdırılma və həmin təklif üçün təsdiqlənmiş müvafiq xərclər daxildir. Ödəniş Epoint vasitəsilə təhlükəsiz həyata keçirilir.' : 'The displayed AZN price includes delivery and applicable charges confirmed for this offer. Payment is processed securely through Epoint.')
    : 'You will be charged in AZN. Secure payment by Epoint.';
  if (code === 'AZ' && $('checkoutCountryMessage')) {
    $('checkoutCountryMessage').textContent = localStorage.getItem('dg_language') === 'az'
      ? 'Məhsulun göstərilən yekun AZN qiymətinə çatdırılma və təsdiqlənmiş müvafiq xərclər daxildir. Ödənişi Epoint vasitəsilə saytda tamamlayın.'
      : 'The displayed final AZN product price includes delivery and confirmed applicable charges. Complete your payment on the website through Epoint.';
  }
  renderCheckoutOrderSummary();
  const checkoutItems = (pendingCheckoutItems?.length ? pendingCheckoutItems : state.cart);
  const unavailable = checkoutItems.some(item => {
    const product = products.find(p => Number(p.id) === Number(item.id));
    return !product || !isProductAvailableInCountry(product, code);
  });
  if (unavailable && $('checkoutCountryMessage')) {
    $('checkoutCountryMessage').textContent = 'One or more products are not available for this destination. Change the country or remove those products before paying.';
  }
}

    async function getCurrentUser() { const r = await fetch('/api/auth/me', { credentials: 'include' }); const d = await r.json(); return d.user || null; }
    async function openAccount() { const user = await getCurrentUser(); $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>My account</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${user ? accountHome(user) : accountForms()}</div></div>`; if (!user) showLoginForm(); }
    function accountForms() { return `<div class="account-tabs"><button id="loginTab" class="account-tab active" onclick="showLoginForm()">Login</button><button id="registerTab" class="account-tab" onclick="showRegisterForm()">Create account</button></div><div id="accountBody"></div><div class="note-box" style="margin-top:12px">Your password is handled by the server and is not stored in your browser local storage.</div>` }
    function showLoginForm() { $('loginTab').classList.add('active'); $('registerTab').classList.remove('active'); $('accountBody').innerHTML = `<form class="form-grid" onsubmit="loginUser(event)"><label>Email<input id="loginEmail" type="email" required autocomplete="email"></label><label>Password<input id="loginPassword" type="password" required autocomplete="current-password"></label><button class="primary-button" type="submit">Login</button></form>`; }
    function showRegisterForm() { $('loginTab').classList.remove('active'); $('registerTab').classList.add('active'); $('accountBody').innerHTML = `<form class="form-grid" onsubmit="registerUser(event)"><label>Full name<input id="regName" required autocomplete="name"></label><label>Email<input id="regEmail" type="email" required autocomplete="email"></label><label>Password<input id="regPassword" minlength="8" type="password" required autocomplete="new-password"></label><button class="primary-button" type="submit">Create account</button></form>`; }
    async function registerUser(e) { e.preventDefault(); const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: $('regName').value.trim(), email: $('regEmail').value.trim(), password: $('regPassword').value }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Unable to create account'); return; } showToast('Account created'); openAccount(); }
    async function loginUser(e) { e.preventDefault(); const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: $('loginEmail').value.trim(), password: $('loginPassword').value }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Unable to sign in'); return; } showToast('Logged in'); openAccount(); }
    function accountHome(user) { return `<p>Welcome back, <strong>${escapeHtml(user.name)}</strong>.</p><div class="note-box">Email: ${escapeHtml(user.email)}<br>Account type: ${user.role === 'admin' ? 'Admin' : 'Customer'}<br><strong>Grind Points:</strong> ${Math.max(0, Number(user.loyaltyPoints) || 0)} <span class="muted">(earned on paid orders while signed in; not redeemable yet)</span></div><div style="display:grid;gap:8px;margin-top:14px"><button class="secondary-button" onclick="openOrderHistory()">My orders</button><button class="secondary-button" onclick="openSupport()">Message the store</button>${user.role === 'admin' ? '<button class="primary-button" onclick="window.location.href=\'/admin.html\'">Admin panel</button>' : ''}<button class="primary-button" onclick="logoutUser()">Log out</button></div>`; }
    async function logoutUser() { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); openAccount(); }
    async function openOrderHistory() {
      const r = await fetch('/api/orders/me', { credentials: 'include' });
      const d = await r.json();
      if (!r.ok) { showToast('Please log in first'); return; }
      const orders = d.orders || [];
      $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>My orders</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${orders.length ? orders.map(o => `<div class="note-box" style="margin-bottom:9px"><strong>${escapeHtml(o.id)}</strong><br>${new Date(o.createdAt).toLocaleString()}<br>Status: ${escapeHtml(o.status)}<br>Total: ${o.total == null ? 'Delivery quote pending' : money(o.total, 'AZN')}<br><button class="text-button" data-track-order="${escapeHtml(o.id)}" data-track-email="${escapeHtml(o.email || '')}">Track order</button></div>`).join('') : '<p class="muted">No orders yet.</p>'}</div></div>`;
      $('modalRoot').querySelectorAll('[data-track-order]').forEach(button => {
        button.addEventListener('click', () => {
          const code = button.dataset.trackOrder || '';
          const email = button.dataset.trackEmail || '';
          closeModal();
          $('trackInput').value = code;
          $('trackEmail').value = email;
          location.hash = 'track';
          trackOrder();
        });
      });
    }
    async function openSupport() {
      const user = await getCurrentUser();
      let old = [];
      if (user) {
        const r = await fetch('/api/messages/me', { credentials: 'include' });
        const d = await r.json();
        if (r.ok) old = d.messages || [];
      }
      $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>Contact DreamGrind</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${user ? `<div class="message-list">${old.slice(-8).map(m => `<div class="message"><strong>You</strong><br>${escapeHtml(m.text)}<small>${new Date(m.createdAt).toLocaleString()}</small></div>`).join('') || '<p class="muted">No messages yet.</p>'}</div>` : '<p class="muted">Send us a message. You do not need to create an account.</p>'}<form class="form-grid" onsubmit="sendMessage(event)">${user ? '' : '<label>Your name<input id="supportName" required minlength="2" maxlength="80" autocomplete="name"></label><label>Email address<input id="supportEmail" type="email" required maxlength="254" autocomplete="email"></label>'}<label class="full">Your message<textarea id="supportMessage" required maxlength="2000" placeholder="How can we help?"></textarea></label><button class="primary-button full" type="submit">Send message</button></form></div></div>`;
    }
    async function sendMessage(e) {
      e.preventDefault();
      const payload = { text: $('supportMessage').value.trim() };
      if ($('supportName')) payload.name = $('supportName').value.trim();
      if ($('supportEmail')) payload.email = $('supportEmail').value.trim();
      const r = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || 'Unable to send your message.'); return; }
      showToast('Message sent. We will get back to you by email.');
      closeModal();
    }
    async function submitDemoOrder(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton?.disabled) return;

  const checkoutItems = (pendingCheckoutItems?.length ? pendingCheckoutItems : state.cart)
    .map(item => ({ id: Number(item.id), qty: Number(item.qty), variant: item.variant ?? null, variantColor: item.variantColor ?? null, variantSize: item.variantSize ?? null }));

  if (!checkoutItems.length) {
    showToast('Your cart is empty');
    return;
  }
  await refreshStoreConfig();
  const checkoutCountry = $('coCountry')?.value || 'United States';
  if (checkoutCountry === 'Azerbaijan' && !storeConfig.azerbaijanCheckoutEnabled) {
    showToast(localStorage.getItem('dg_language') === 'az' ? 'Azərbaycan üzrə checkout müvəqqəti dayandırılıb.' : 'Azerbaijan checkout is temporarily paused.');
    return;
  }

  const normalizedPhone = normalizeCheckoutPhone(checkoutCountry, $('coPhone')?.value || '');
  if (!normalizedPhone) {
    showToast(checkoutPhoneError(checkoutCountry, localStorage.getItem('dg_language') === 'az'));
    $('coPhone')?.focus();
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Preparing secure payment…';
  }

  try {
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: $('coName').value.trim(),
        email: $('coEmail').value.trim(),
        phone: normalizedPhone,
        address: $('coAddress').value.trim(),
        addressLine2: $('coAddressLine2')?.value.trim() || '',
        deliveryNotes: $('coDeliveryNotes')?.value.trim() || '',
        city: $('coCity').value.trim(),
        state: $('coState').value.trim(),
        zip: $('coZip').value.trim(),
        country: $('coCountry').value,
        items: checkoutItems
      })
    });

    const d = await r.json();
    if (!r.ok) {
      showToast(d.error || 'Please check your details and try again.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Continue to secure payment';
      }
      return;
    }

    const shippingAnalytics = dgAnalyticsValueFor(checkoutItems);
    window.DGAnalytics?.track('add_shipping_info', {
      ...shippingAnalytics,
      shipping_tier: checkoutCountry
    });

    if (d.requiresShippingQuote && d.order?.id) {
      if (sessionStorage.getItem('dg_checkout_mode') !== 'buy-now') {
        state.cart = [];
        saveAll();
      }
      sessionStorage.removeItem('dg_checkout_mode');
      const orderId = d.order.id;
      const langAz = localStorage.getItem('dg_language') === 'az';
      const waText = encodeURIComponent(`Hello DreamGrind, I submitted order request ${orderId}. Please confirm the delivery fee and payment details.`);
      $('modalRoot').innerHTML = `<div class="modal-overlay"><div class="modal"><div class="modal-head"><h2>${langAz ? 'Sifariş sorğunuz qəbul edildi' : 'Your order request was received'}</h2><button class="close-btn" onclick="closeModal()">✕</button></div><div class="note-box"><strong>${langAz ? 'Sifariş nömrəsi' : 'Order number'}: ${escapeHtml(orderId)}</strong><p>${langAz ? 'Məhsul məbləği: ' : 'Product subtotal: '}${money(Number(d.order.subtotal || 0), 'AZN')}</p><p>${langAz ? 'Çatdırılma haqqını yoxlayıb təsdiq etdikdən sonra sizə yekun məbləğ və təhlükəsiz Epoint ödəniş linki göndərəcəyik. Bu mərhələdə ödəniş tutulmayıb.' : 'We will confirm the delivery fee, send you the final total and provide a secure Epoint payment link. No payment has been taken yet.'}</p></div><p class="muted">${langAz ? 'Sifarişinizlə bağlı WhatsApp vasitəsilə də əlaqə saxlaya bilərsiniz.' : 'You can also contact us on WhatsApp about your order.'}</p><a class="primary-button full" style="display:block;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/994998998097?text=${waText}">${langAz ? 'WhatsApp ilə əlaqə saxla' : 'Contact us on WhatsApp'}</a><a class="secondary-button full" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="mailto:dreamgrindstore@gmail.com?subject=${encodeURIComponent(`DreamGrind order ${orderId}`)}">${langAz ? 'E-poçt göndər' : 'Email us'}</a><button class="secondary-button full" style="margin-top:10px" onclick="closeModal()">${langAz ? 'Mağazaya qayıt' : 'Continue shopping'}</button></div></div>`;
      return;
    }

    if (!d.order?.id || !d.checkoutToken) {
      console.error('Order response did not include secure checkout credentials.');
      showToast('Order was created, but secure payment could not be started. Contact support with your order number.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Continue to secure payment';
      }
      return;
    }

    const paymentResponse = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderId: d.order.id, checkoutToken: d.checkoutToken })
    });

    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || !payment.redirect_url) {
      console.error('Payment creation failed for order:', d.order.id, payment.error || 'No redirect URL');
      showToast(payment.error || `Order ${d.order.id} was saved, but payment could not be started.`);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Continue to secure payment';
      }
      return;
    }

    if (window.DGAnalytics?.getConsent?.() === 'granted') {
      const checkoutAnalytics = dgAnalyticsValueFor(checkoutItems);
      sessionStorage.setItem('dg_analytics_checkout', JSON.stringify(checkoutAnalytics));
      window.DGAnalytics.track('add_payment_info', { ...checkoutAnalytics, payment_type: 'Epoint' });
    }
    sessionStorage.setItem('dg_checkout_email', $('coEmail').value.trim());
    sessionStorage.setItem('dg_checkout_order', d.order.id);
    window.location.href = payment.redirect_url;
  } catch (error) {
    console.error('CHECKOUT ERROR:', error);
    showToast('Unable to continue to payment. Please try again.');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Continue to secure payment';
    }
  }
}

    async function trackOrder(event) {
      event?.preventDefault();
      const code = $('trackInput').value.trim().toUpperCase();
      const email = $('trackEmail').value.trim();
      const langAz = localStorage.getItem('dg_language') === 'az';
      if (!code || !email) {
        $('trackingResult').innerHTML = `<p class="muted">${langAz ? 'Sifariş nömrəsini və checkout e-poçtunu daxil edin.' : 'Enter your order number and checkout email.'}</p>`;
        return;
      }
      const button = $('track')?.querySelector('button[type="submit"]');
      if (button) { button.disabled = true; button.textContent = langAz ? 'Yoxlanılır…' : 'Checking…'; }
      $('trackingResult').innerHTML = `<p class="muted">${langAz ? 'Sifariş məlumatı yoxlanılır…' : 'Checking your order details…'}</p>`;
      try {
        const r = await fetch('/api/orders/track/' + encodeURIComponent(code), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          cache: 'no-store'
        });
        const d = await r.json();
        if (!r.ok) {
          $('trackingResult').innerHTML = `<p class="muted">${langAz ? 'Sifariş tapılmadı. Sifariş nömrəsini və checkout e-poçtunu yoxlayın.' : 'Order not found. Check the order number and checkout email.'}</p>`;
          return;
        }
        const order = d.order;
        const paymentLabel = order.paymentStatus === 'Paid'
          ? (langAz ? 'Ödənilib' : 'Paid')
          : order.paymentStatus === 'Refunded'
            ? (langAz ? 'Geri ödənilib' : 'Refunded')
            : order.paymentStatus === 'Failed'
              ? (langAz ? 'Ödəniş tamamlanmayıb' : 'Payment not completed')
              : order.paymentStatus === 'Awaiting quote'
                ? (langAz ? 'Çatdırılma haqqı təsdiq gözləyir' : 'Delivery fee awaiting confirmation')
                : (langAz ? 'Ödəniş təsdiqi gözlənilir' : 'Awaiting payment confirmation');
        const safeTrackingUrl = /^https:\/\//i.test(String(order.trackingUrl || '')) ? String(order.trackingUrl) : '';
        const trackingMarkup = order.trackingNumber
          ? `<div class="note-box" style="margin-top:12px"><strong>${langAz ? 'Daşıyıcının izləmə nömrəsi' : 'Carrier tracking number'}</strong><br><span>${escapeHtml(order.trackingNumber)}</span>${safeTrackingUrl ? `<p style="margin:10px 0 0"><a href="${escapeHtml(safeTrackingUrl)}" target="_blank" rel="noopener noreferrer">${langAz ? 'Daşıyıcıda izlə ↗' : 'Track with carrier ↗'}</a></p>` : ''}</div>`
          : `<p class="muted" style="margin-top:12px">${langAz ? 'Sifariş göndərildikdən və izləmə nömrəsi əlavə edildikdən sonra məlumat burada görünəcək.' : 'Carrier tracking details will appear here after dispatch and once the tracking number has been added.'}</p>`;
        const totalMarkup = Number.isFinite(Number(order.total))
          ? `<p><strong>${langAz ? 'Yekun məbləğ:' : 'Order total:'}</strong> ${money(Number(order.total), order.currency || 'AZN')}</p>`
          : '';
        $('trackingResult').innerHTML = `<div class="tracking-result"><div class="tracking-meta"><div><strong>${langAz ? 'Sifariş' : 'Order'} ${escapeHtml(order.id)}</strong><div class="muted">${langAz ? 'Yaradılma tarixi' : 'Created'} ${new Date(order.createdAt).toLocaleString()}</div></div><div class="tracking-status">${escapeHtml(order.status)}</div></div><p><strong>${langAz ? 'Ödəniş:' : 'Payment:'}</strong> ${escapeHtml(paymentLabel)}</p>${totalMarkup}${trackingMarkup}<p class="muted" style="margin-top:12px">${langAz ? 'Status DreamGrind tərəfindən yenilənir. Daşıyıcının hərəkət məlumatları bu səhifədə canlı rejimdə göstərilmir.' : 'Order statuses are updated by DreamGrind. Carrier movement updates are not live on this page.'}</p></div>`;
      } catch (error) {
        console.error('ORDER TRACKING ERROR:', error);
        $('trackingResult').innerHTML = `<p class="muted">${langAz ? 'Sifarişi yoxlamaq mümkün olmadı. Yenidən cəhd edin.' : 'Unable to check your order right now. Please try again.'}</p>`;
      } finally {
        if (button) { button.disabled = false; button.textContent = langAz ? 'Sifarişi izlə' : 'Track order'; }
      }
    }
    function showPolicy(type) {
  const copy = {
    shipping: {
      title: 'Shipping Policy',
      html: `
        <h3>Shipping destinations</h3>
        <p>DreamGrind accepts orders for customers in the United States, Canada, the United Kingdom and Azerbaijan. For Azerbaijan, only products with a confirmed final AZN price are available for normal checkout. The displayed price includes the product, delivery and applicable import charges confirmed for that specific offer.</p>

        <h3>Shipping cost</h3>
        <p>For the United States, Canada and the United Kingdom, the store currently shows free shipping at checkout. Delivery estimates depend on the product and confirmed fulfilment route; DreamGrind does not promise a fixed number of days unless an estimate is shown for that product or confirmed by support.</p>
        <p>For Azerbaijan, there is no separate shipping line at checkout because the product's final AZN price is entered to include the delivery cost and only those applicable import or handling charges that DreamGrind has confirmed for that exact offer.</p>

        <h3>Customs, duties and taxes</h3>
        <p>DreamGrind does not make a blanket DDP or tax-paid delivery promise. Import duties, VAT and handling charges are included only when the product offer explicitly says they are covered. Any charge not clearly included in the offer may be payable by the recipient under local rules. Please contact support before ordering if you need clarification for your destination.</p>

        <h3>Processing time</h3>
        <p>Orders are normally processed after successful payment confirmation. Processing and delivery times vary by product, destination, stock availability, customs procedures and carrier. Where a delivery estimate is not displayed, contact support before ordering for the latest route information.</p>

        <h3>Tracking</h3>
        <p>When tracking information is available, it may be provided to the customer after the order has been dispatched.</p>

        <h3>Delivery delays</h3>
        <p>DreamGrind is not responsible for delays caused by carriers, customs procedures, weather or other circumstances outside our reasonable control.</p>
      `
    },

    returns: {
      title: 'Returns & Refunds',
      html: `
        <h3>Return requests</h3>
        <p>Customers should contact DreamGrind before returning an item so that return instructions can be provided.</p>

        <h3>Damaged or incorrect items</h3>
        <p>If an item arrives damaged, defective or different from the item ordered, please contact customer support with the order number and relevant details as soon as possible.</p>

        <h3>Refunds</h3>
        <p>Approved refunds are processed after the return or issue has been reviewed. The time required for the refund to appear in the customer's account may depend on the payment provider or bank.</p>

        <h3>Exclusions</h3>
        <p>Items that have been used, damaged after delivery or returned without following the provided return instructions may not qualify for a refund.</p>
      `
    },

    privacy: {
      title: 'Privacy Policy',
      html: `
        <h3>1. Information we collect</h3>
        <p>DreamGrind may collect information that customers provide when creating an account, placing an order or contacting customer support. This may include name, email address, phone number, delivery address, city, country and order information.</p>

        <h3>2. How we use information</h3>
        <p>We use customer information to create and manage accounts, process orders, arrange delivery, provide order tracking, respond to customer requests, verify reviews against paid orders, maintain website security and comply with applicable legal obligations. Optional analytics are used only after the visitor gives permission. A single unfinished-checkout reminder is sent only when a customer explicitly opts in at checkout.</p>

        <h3>3. Payments</h3>
        <p>Online payments are processed through our payment provider, Epoint. DreamGrind does not intentionally store customers' full payment card details on its own website servers.</p>

        <h3>4. Service providers</h3>
        <p>We may use trusted third-party service providers for payment processing, website hosting, database infrastructure, optional email delivery, analytics where permitted, delivery and other services necessary to operate the store. When an order is fulfilled by an overseas supplier or logistics partner, we may share the customer's name, phone number, delivery address and relevant order details with that provider only to arrange fulfilment, customs processing and delivery. This may involve transferring information to service providers outside the customer's country, subject to applicable legal requirements.</p>

        <h3>5. Verified product reviews</h3>
        <p>To verify a review, we check the order number and checkout email against a paid order containing the product. The public review displays the review text, rating and the customer's first name only. The order number and email address are not displayed publicly.</p>

        <h3>6. Optional checkout reminders</h3>
        <p>If a customer checks the separate reminder option at checkout, DreamGrind may send one email about that unfinished checkout after two hours. This is not a newsletter subscription or general marketing consent. The customer can cancel the pending reminder by unchecking the option before leaving checkout, or unsubscribe using the link in the reminder email.</p>

        <h3>7. Cookies and local storage</h3>
        <p>The website may use essential cookies and browser local storage to support account sessions, shopping cart preferences, country selection and language preferences. Optional Google Analytics is loaded only after the visitor opts in using the cookie controls.</p>

        <h3>8. Data retention</h3>
        <p>Customer information is retained for as long as reasonably necessary to provide services, maintain business records, resolve disputes, prevent fraud and meet applicable legal requirements.</p>

        <h3>9. Data security</h3>
        <p>DreamGrind takes reasonable technical and organisational measures to protect customer information against unauthorised access, alteration or disclosure.</p>

        <h3>10. Contact</h3>
        <p>Customers may contact DreamGrind through the Contact Us section of the website regarding privacy or personal information questions.</p>
      `
    },

    terms: {
      title: 'Terms & Conditions',
      html: `
        <h3>1. Website use</h3>
        <p>By using the DreamGrind website, you agree to use the website lawfully and not to misuse its services or attempt to interfere with its operation.</p>

        <h3>2. Products and prices</h3>
        <p>Product availability, descriptions and prices may change without prior notice. We aim to keep product information accurate, but occasional errors may occur.</p>

        <h3>3. Orders</h3>
        <p>An order is submitted when the customer completes checkout. An order becomes a confirmed paid order only after successful payment confirmation.</p>

        <h3>4. Payment</h3>
        <p>Payments are processed securely through Epoint. Orders may be cancelled or not completed when payment is declined, cancelled or otherwise unsuccessful.</p>

        <h3>5. Shipping</h3>
        <p>Delivery times may vary depending on destination, product availability, customs procedures and carrier performance.</p>

        <h3>6. Returns and refunds</h3>
        <p>Returns and refunds are handled according to the DreamGrind Returns & Refunds Policy.</p>

        <h3>7. Changes to these terms</h3>
        <p>DreamGrind may update these terms when necessary. The current version published on the website will apply to future use of the website.</p>
      `
    },

    cookies: {
      title: 'Cookies & Local Storage',
      html: `
        <h3>How we use cookies and local storage</h3>
        <p>DreamGrind uses essential browser storage technologies to support website functionality, including account sessions, shopping cart preferences, country selection and language preferences.</p>

        <h3>Third-party services</h3>
        <p>Some services used by the website, such as payment processing or hosting infrastructure, may use their own technical cookies or similar technologies where necessary to provide their services.</p>

        <h3>Optional analytics</h3>
        <p>With your permission, DreamGrind may use Google Analytics to understand store visits and checkout steps. Analytics is optional. Advertising storage, advertising personalisation and advertising user-data consent remain disabled. When analytics is configured, you can change your choice using Cookie settings in the website footer.</p>
        
      `
    }
  };

  const selected = copy[type] || copy.privacy;

  $('modalRoot').innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal">
        <div class="modal-head">
          <h2>${selected.title}</h2>
          <button class="close-btn" onclick="closeModal()">✕</button>
        </div>
        <div class="policy-copy">
          ${selected.html}
        </div>
      </div>
    </div>
  `;
}
    async function subscribe(e) { e.preventDefault(); const email = $('newsletterEmail').value.trim(); const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Unable to subscribe'); return; } $('newsletterEmail').value = ''; showToast('Subscribed'); }
    function closeModal(e) { if (e && e.target !== e.currentTarget) return; $('modalRoot').innerHTML = ''; }
   const paymentParams = new URLSearchParams(window.location.search);
const paymentReturnStatus = paymentParams.get('payment');
const returnedOrderId = paymentParams.get('order_id');

async function handlePaymentReturn() {
  if (!['success', 'error'].includes(paymentReturnStatus)) return;
  window.history.replaceState({}, '', '/');
  if (!returnedOrderId) {
    sessionStorage.removeItem('dg_checkout_mode');
    showToast('We could not find the order number to verify this payment. Please contact support before trying again.');
    return;
  }

  let order = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const checkoutEmail = sessionStorage.getItem('dg_checkout_email') || '';
      if (!checkoutEmail) break;
      const response = await fetch('/api/orders/track/' + encodeURIComponent(returnedOrderId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: checkoutEmail }), cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.order) {
        order = data.order;
        if (['Paid', 'Failed', 'Refunded'].includes(order.paymentStatus)) break;
      }
    } catch (error) {
      console.warn('Unable to verify Epoint payment status yet.', error);
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  const checkoutMode = sessionStorage.getItem('dg_checkout_mode') || 'cart';
  sessionStorage.removeItem('dg_checkout_mode');
  sessionStorage.removeItem('dg_checkout_email');

  if (order?.paymentStatus === 'Paid') {
    if (window.DGAnalytics?.getConsent?.() === 'granted') {
      try {
        const checkoutAnalytics = JSON.parse(sessionStorage.getItem('dg_analytics_checkout') || 'null');
        if (checkoutAnalytics && Array.isArray(checkoutAnalytics.items)) {
          sessionStorage.setItem('dg_pending_purchase', JSON.stringify({ ...checkoutAnalytics, transaction_id: returnedOrderId }));
          window.DGAnalytics.flushPendingPurchase?.();
        }
      } catch (error) { console.warn('Unable to prepare purchase analytics.', error); }
    }
    sessionStorage.removeItem('dg_analytics_checkout');
    if (checkoutMode !== 'buy-now') {
      state.cart = [];
      saveAll();
    }
    showToast(`Payment confirmed. Order ${returnedOrderId}. Thank you!`);
  } else if (order?.paymentStatus === 'Refunded') {
    showToast(`Order ${returnedOrderId} has been refunded. Contact support if you need assistance.`);
  } else if (order?.paymentStatus === 'Failed' || paymentReturnStatus === 'error') {
    showToast(`Payment was not confirmed for ${returnedOrderId}. Your cart is still saved.`);
  } else {
    showToast(`Payment confirmation is still pending for order ${returnedOrderId}. Do not pay again yet. Your cart has been kept.`);
  }
}
    window.addEventListener('popstate', () => {
      const productId = new URLSearchParams(window.location.search).get('product');
      if (productId) {
        renderProductPage(productId);
      } else if (productPageOpen) {
        dismissProductPage(false);
      }
    });

    syncCountryPicker();
    saveAll();
    refreshStoreConfig();
    loadProducts();
    initLanguage();
    handlePaymentReturn();
