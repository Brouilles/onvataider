import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import {
  Container, Button,
} from 'reactstrap';
import { Meteor } from 'meteor/meteor';

class Invoice extends Component {
  state = {
    data: null,
    date: null,
  }

  componentDidMount() {
    const { history } = this.props;

    Meteor.call('getInvoice', this.props.match.params.id, (error, result) => {
      if (error) { return history.push('/introuvable'); }

      const tempDate = new Date(result.createdAt);
      this.setState({
        data: result,
        date: tempDate.toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
      });
    });
  }

  render() {
    const { data, date } = this.state;

    if (data !== null) {
      return (
        <Wrapper id="main-content" className="invoice">
          <div className="row invoice-header">
            <div className="col-5">
              <img src="/logo/logo.png" alt="Logo Onvataider" className="invoice-logo" />
            </div>
            <div className="col-7 invoice-order"><span className="invoice-id">Facture <small>#{data._id}</small></span><span className="incoice-date">{date}</span></div>
          </div>
          <div className="row invoice-data">
            <div className="col-5 invoice-person">
              <span className="name">{data.creatorData.profile.companyName != null && data.creatorData.profile.companyName.length > 0 ? data.creatorData.profile.companyName : `${data.creatorData.profile.name} ${data.creatorData.profile.familyName}` }</span>
              <span>{data.creatorData.line1}</span>
              <span>{data.creatorData.postal_code} - {data.creatorData.city}</span>
              <span>{data.creatorData.state}</span>
              <span>{data.creatorData.profile.website}</span>
            </div>
            <div className="col-2 invoice-payment-direction" />
            <div className="col-5 invoice-person">
              <span className="name">{data.userData.profile.companyName != null && data.userData.profile.companyName > 0 ? data.userData.profile.companyName : `${data.userData.profile.name} ${data.userData.profile.familyName}` }</span>
              <span>{data.address.line1}</span>
              <span>{data.address.postal_code} - {data.address.city}</span>
              <span>{data.address.country}</span>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <table className="invoice-details">
                <tbody>
                  <tr>
                    <th style={{ width: '60%' }}>Désignation</th>
                    <th style={{ width: '17%' }} className="hours">Quantité</th>
                    <th style={{ width: '15%' }} className="amount">Prix</th>
                  </tr>
                  <tr>
                    <td className="description">{data.rewardName}</td>
                    <td className="hours">1</td>
                    <td className="amount">{data.amount}€</td>
                  </tr>
                  <tr>
                    <td />
                    <td className="summary total">Total</td>
                    <td className="amount total-value">{data.amount}€</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 invoice-message"><span className="title">Votre commentaire</span>
              <p>{data.comment || 'Pas de commentaire'}</p>
            </div>
          </div>
          <div className="row invoice-company-info">
            <div className="col-sm-6 col-md-2 logo"><img src="/logo/onvataiderx96.png" alt="Logo-symbol" /></div>
            <div className="col-sm-6 col-md-7 summary">
              <span className="title">Onvataider</span>
              <p>Pour savoir si votre don est défiscalisable, merci de vous adresser au porteur de projet ou à la personne responsable de la collecte.</p>
            </div>
            <div className="col-sm-6 col-md-3 email">
              <ul className="list-unstyled">
                <li>contact@onvataider.com</li>
                <li>{data.creatorData.emails[0].address}</li>
              </ul>
            </div>
          </div>
          <div className="print-hide row invoice-footer">
            <div className="col-md-12">
              <Button onClick={() => window.print()} className="btn-space" color="primary" size="lg">Impression</Button>
            </div>
          </div>
        </Wrapper>
      );
    }

    return ('Chargement ...');
  }
}

export default withRouter(Invoice);

const Wrapper = styled(Container)`
  background: white;

  .invoice {
    background-color: #ffffff;
    padding: 100px 100px 70px;
    color: #8c8c8c;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice {
      padding: 50px 50px 35px;
    }
  }
  @media (max-width: 480px) {
    .invoice {
      padding: 35px 25px 15px;
    }
  }
  .invoice-header {
    margin-bottom: 100px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-header {
      margin-bottom: 50px;
    }
  }
  @media (max-width: 480px) {
    .invoice-header > div {
      float: none;
      width: 100%;
    }
  }
  .invoice-logo {
    height: 32px;
  }
  @media (max-width: 480px) {
    .invoice-logo {
      margin: 0 auto 20px;
      float: none;
      min-width: auto;
    }
  }
  .invoice-order {
    text-align: right;
  }
  @media (max-width: 480px) {
    .invoice-order {
      text-align: center;
    }
  }
  .invoice-id {
    display: block;
    font-size: 30px;
    line-height: 30px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-id {
      font-size: 15px;
      line-height: 18px;
    }
  }
  .incoice-date {
    display: block;
    font-size: 18px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .incoice-date {
      font-size: 13px;
    }
  }
  .invoice-data {
    margin-bottom: 110px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-data {
      margin-bottom: 55px;
    }
  }
  @media (max-width: 480px) {
    .invoice-data > div {
      float: none;
      width: 100%;
    }
  }
  @media (max-width: 480px) {
    .invoice-person {
      text-align: center;
    }
  }
  .invoice-person span {
    font-size: 18px;
    line-height: 26px;
    display: block;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-person span {
      font-size: 13px;
      line-height: 20px;
    }
  }
  .invoice-person .name {
    font-weight: 500;
  }
  .invoice-person:last-child {
    text-align: right;
  }
  @media (max-width: 480px) {
    .invoice-person:last-child {
      text-align: center;
    }
  }
  .invoice-payment-direction {
    text-align: center;
    position: relative;
    padding-top: 20px;
  }
  @media (max-width: 480px) {
    .invoice-payment-direction {
      padding: 20px;
    }
  }
  .invoice-payment-direction .icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #f7f7f7;
    font-size: 50px;
    color: #c2c2c2;
    line-height: 80px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-payment-direction .icon {
      width: 40px;
      height: 40px;
      line-height: 40px;
      font-size: 25px;
    }
  }
  @media (max-width: 480px) {
    .invoice-payment-direction .icon {
      -webkit-transform: rotate(90deg);
          -ms-transform: rotate(90deg);
          -o-transform: rotate(90deg);
              transform: rotate(90deg);
    }
  }
  .invoice-details {
    width: 100%;
    font-size: 16px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-details {
      font-size: 11px;
    }
  }
  .invoice-details tr > td {
    padding: 20px 0;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-details tr > td {
      padding: 15px 0;
    }
  }
  .invoice-details th {
    text-align: right;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }
  .invoice-details th:first-child {
    text-align: left;
  }
  .invoice-details td.description,
  .invoice-details td.hours,
  .invoice-details td.amount,
  .invoice-details td.summary {
    border-bottom: 1px solid #f0f0f0;
  }
  .invoice-details td.hours {
    text-align: right;
  }
  .invoice-details td.amount {
    text-align: right;
  }
  .invoice-details td.summary {
    color: #c4c4c4;
  }
  .invoice-details td.total {
    color: #8c8c8c;
    font-weight: 500;
  }
  .invoice-details td.total-value {
    font-size: 22px;
    color: #4285f4;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-details td.total-value {
      font-size: 11px;
    }
  }
  .invoice-payment-method {
    margin-bottom: 75px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-payment-method {
      margin-bottom: 37px;
    }
  }
  .invoice-payment-method span {
    font-size: 18px;
    line-height: 26px;
    display: block;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-payment-method span {
      font-size: 13px;
      line-height: 20px;
    }
  }
  .invoice-payment-method .title {
    font-weight: 500;
  }
  .invoice-message {
    font-size: 16px;
    margin-bottom: 62px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-message {
      font-size: 13px;
    }
  }
  @media (max-width: 480px) {
    .invoice-message {
      margin-bottom: 31px;
    }
  }
  .invoice-message .title {
    font-weight: 500;
    text-transform: uppercase;
    display: block;
    margin-bottom: 12px;
  }
  .invoice-message p {
    line-height: 26px;
  }
  @media (min-width: 768px) and (max-width: 991px), (max-width: 767px) {
    .invoice-message p {
      line-height: 20px;
    }
  }
  .invoice-company-info {
    margin-bottom: 70px;
  }
  @media (max-width: 767px), (max-width: 480px) {
    .invoice-company-info {
      margin-bottom: 35px;
    }
  }
  .invoice-company-info > div {
    border-left: 1px solid #f0f0f0;
    padding: 8px 40px;
  }
  @media (max-width: 767px), (max-width: 480px) {
    .invoice-company-info > div {
      border: none;
      padding: 8px 15px;
    }
  }
  .invoice-company-info > div:first-child {
    border-left: none;
  }
  .invoice-company-info .summary {
    padding: 0 40px 0;
    line-height: 16px;
  }
  @media (max-width: 767px), (max-width: 480px) {
    .invoice-company-info .summary {
      padding: 8px 15px;
    }
  }
  .invoice-company-info .summary .title {
    color: #8c8c8c;
    font-size: 14px;
    line-height: 21px;
    font-weight: 500;
  }
  .invoice-company-info .summary p {
    line-height: 16px;
  }
  @media (min-width: 768px) and (max-width: 991px) {
    .invoice-company-info .phone {
      border-left-width: 0;
    }
  }
  .invoice-footer {
    text-align: center;
  }
  .invoice-footer .btn {
    min-width: 96px;
    font-size: 14px;
  }
`;
