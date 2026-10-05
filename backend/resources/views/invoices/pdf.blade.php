<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>فاتورة {{ $invoice->invoice_number }}</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: dejavusans;
            direction: rtl;
            text-align: right;
            color: #0D2B4E;
            font-size: 12px;
            line-height: 1.75;
        }

        .header {
            width: 100%;
            border-bottom: 2px solid #16A6C9;
            padding-bottom: 14px;
            margin-bottom: 20px;
        }

        .brand {
            font-size: 23px;
            font-weight: bold;
            color: #0D2B4E;
        }

        .subtitle {
            margin-top: 3px;
            color: #66788A;
            font-size: 12px;
        }

        .status {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 10px;
            border-radius: 10px;
            background: #F7F9FC;
            font-weight: bold;
        }

        .section {
            margin-bottom: 18px;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 7px;
            color: #0D2B4E;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            direction: rtl;
        }

        td,
        th {
            text-align: right;
            vertical-align: top;
        }

        .info-table td {
            width: 50%;
            padding: 7px 8px;
            border-bottom: 1px solid #E4EAF0;
        }

        .label {
            color: #748191;
            font-size: 10px;
        }

        .value {
            color: #0D2B4E;
            font-weight: bold;
        }

        .summary-table th,
        .summary-table td {
            padding: 9px 8px;
            border-bottom: 1px solid #E4EAF0;
        }

        .summary-table th {
            background: #F7F9FC;
            font-weight: bold;
        }

        .total-row td {
            border-top: 2px solid #16A6C9;
            font-weight: bold;
            font-size: 13px;
        }

        .ltr {
            direction: ltr;
            text-align: right;
        }

        .footer {
            margin-top: 26px;
            border-top: 1px solid #E4EAF0;
            padding-top: 10px;
            color: #7D8996;
            text-align: center;
            font-size: 9px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">نمير — NUMAYR</div>
        <div class="subtitle">فاتورة ضريبية</div>

        <div class="status">
            الحالة:
            @if ($invoice->status === 'paid')
                مدفوعة
            @elseif ($invoice->status === 'refunded')
                مستردة
            @elseif ($invoice->status === 'void')
                ملغاة
            @else
                صادرة
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">بيانات الفاتورة</div>

        <table class="info-table">
            <tr>
                <td>
                    <span class="label">رقم الفاتورة</span><br>
                    <span class="value ltr">{{ $invoice->invoice_number }}</span>
                </td>

                <td>
                    <span class="label">تاريخ الإصدار</span><br>
                    <span class="value">
                        {{ $invoice->issued_at?->format('Y-m-d H:i') ?? '-' }}
                    </span>
                </td>
            </tr>

            <tr>
                <td>
                    <span class="label">رقم الطلب</span><br>
                    <span class="value ltr">{{ $invoice->order?->order_number ?? '-' }}</span>
                </td>

                <td>
                    <span class="label">تاريخ الدفع</span><br>
                    <span class="value">
                        {{ $invoice->paid_at?->format('Y-m-d H:i') ?? '-' }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">بيانات العميل</div>

        <table class="info-table">
            <tr>
                <td>
                    <span class="label">الاسم</span><br>
                    <span class="value">{{ $invoice->customer_name ?? '-' }}</span>
                </td>

                <td>
                    <span class="label">رقم الجوال</span><br>
                    <span class="value ltr">{{ $invoice->customer_phone ?? '-' }}</span>
                </td>
            </tr>

            <tr>
                <td colspan="2">
                    <span class="label">البريد الإلكتروني</span><br>
                    <span class="value ltr">{{ $invoice->customer_email ?? '-' }}</span>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">تفاصيل الخدمة</div>

        <table class="summary-table">
            <thead>
                <tr>
                    <th>الخدمة</th>
                    <th>قبل الضريبة</th>
                    <th>الضريبة</th>
                    <th>الإجمالي</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>{{ $invoice->service_name ?? $invoice->service_code }}</td>

                    <td>
                        {{ number_format((float) $invoice->subtotal, 2) }}
                        {{ $invoice->currency }}
                    </td>

                    <td>
                        {{ number_format((float) $invoice->tax_amount, 2) }}
                        {{ $invoice->currency }}
                        ({{ number_format((float) $invoice->tax_rate, 2) }}%)
                    </td>

                    <td>
                        {{ number_format((float) $invoice->total_amount, 2) }}
                        {{ $invoice->currency }}
                    </td>
                </tr>

                <tr class="total-row">
                    <td colspan="3">الإجمالي النهائي</td>
                    <td>
                        {{ number_format((float) $invoice->total_amount, 2) }}
                        {{ $invoice->currency }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    @if (! empty($invoice->address_snapshot))
        <div class="section">
            <div class="section-title">عنوان الخدمة</div>

            <div>
                {{ $invoice->address_snapshot['label'] ?? '' }}

                @if (! empty($invoice->address_snapshot['city']))
                    - {{ $invoice->address_snapshot['city'] }}
                @endif

                @if (! empty($invoice->address_snapshot['district']))
                    - {{ $invoice->address_snapshot['district'] }}
                @endif

                @if (! empty($invoice->address_snapshot['street']))
                    - {{ $invoice->address_snapshot['street'] }}
                @endif

                @if (! empty($invoice->address_snapshot['building']))
                    - مبنى {{ $invoice->address_snapshot['building'] }}
                @endif
            </div>
        </div>
    @endif

    @if ($invoice->payment)
        <div class="section">
            <div class="section-title">بيانات الدفع</div>

            <table class="info-table">
                <tr>
                    <td>
                        <span class="label">طريقة الدفع</span><br>
                        <span class="value">
                            {{ $invoice->payment->method ?? '-' }}
                        </span>
                    </td>

                    <td>
                        <span class="label">حالة الدفع</span><br>
                        <span class="value">
                            {{ $invoice->payment->status ?? '-' }}
                        </span>
                    </td>
                </tr>

                <tr>
                    <td>
                        <span class="label">رقم العملية</span><br>
                        <span class="value ltr">
                            {{ $invoice->payment->transaction_id ?? '-' }}
                        </span>
                    </td>

                    <td>
                        <span class="label">مرجع مزود الدفع</span><br>
                        <span class="value ltr">
                            {{ $invoice->payment->provider_reference ?? '-' }}
                        </span>
                    </td>
                </tr>
            </table>
        </div>
    @endif

    <div class="footer">
        تم إصدار هذه الفاتورة إلكترونيًا بواسطة منصة نمير.
    </div>
</body>
</html>
