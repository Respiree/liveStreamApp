package com.respiree.app;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.SweepGradient;
import android.graphics.Typeface;
import androidx.core.content.ContextCompat;
import androidx.core.content.res.ResourcesCompat;
import android.util.AttributeSet;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;

import java.text.DecimalFormat;

import com.respiree.app.R;

public class CalmnessStressCircularChartView extends View {

    private final int graphWidth = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 200, getResources().getDisplayMetrics());
    private final int graphStrokeWidth = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 55, getResources().getDisplayMetrics());
    private final int percentageTextWidth = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 70, getResources().getDisplayMetrics());
    private final int percentageTextOffset = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 10, getResources().getDisplayMetrics());
    private final int percentageTextSize = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 26, getResources().getDisplayMetrics());
    private final int labelTextSize = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 16, getResources().getDisplayMetrics());
    private final int labelHeight = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 20, getResources().getDisplayMetrics());
    private final int labelWidth = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 100, getResources().getDisplayMetrics());
    private final int labelMargin = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 20, getResources().getDisplayMetrics());
    private final int shadowBlur = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 9, getResources().getDisplayMetrics());

    private int measuredWidth;
    private int desiredHeight;

    private RectF graphBounds = new RectF();
    private RectF calmnessPercentBounds = new RectF();
    private RectF stressPercentBounds = new RectF();
    private RectF calmnessLabelBounds = new RectF();
    private RectF stressLabelBounds = new RectF();
    private RectF calmnessValueBounds = new RectF();
    private RectF stressValueBounds = new RectF();

    private Paint calmnessPaint = new Paint();
    private int calmnessStartColor = Color.parseColor("#bf4a90e2");
    private int calmnessEndColor = Color.parseColor("#bf35d8be");
    private Paint stressPaint = new Paint();
    private int stressStartColor = Color.parseColor("#bf4059F3");
    private int stressEndColor = Color.parseColor("#bf4A90E2");
    private Paint percentTextPaint = new Paint();
    private int percentTextColor = ContextCompat.getColor(getContext(), R.color.caliowhite);
    private Paint calmnessPercentBgPaint = new Paint();
    private int calmnessPercentBgColor = Color.parseColor("#cc35d8be");
    private Paint stressPercentBgPaint = new Paint();
    private int stressPercentBgColor = Color.parseColor("#cc4059f3");
    private Paint calmnessLabelPaint = new Paint();
    private int calmnessLabelColor = ContextCompat.getColor(getContext(), R.color.aqua_marine);
    private Paint stressLabelPaint = new Paint();
    private int stressLabelColor = ContextCompat.getColor(getContext(), R.color.warm_blue);
    private Paint calmnessValuePaint = new Paint();
    private Paint stressValuePaint = new Paint();
    private int shadowColor = Color.parseColor("#cc208771");

    private Typeface percentTextFont = ResourcesCompat.getFont(getContext(), R.font.karla_bold);
    private Typeface labelTextFont = ResourcesCompat.getFont(getContext(), R.font.karla_regular);
    private Typeface labelValueFont = ResourcesCompat.getFont(getContext(), R.font.karla_bold);

    private float stress = 0.5f;
    private boolean display = true;
    private float stressUpper = 0.7f;
    private float stressLower = 0.3f;

    public CalmnessStressCircularChartView(Context context) {
        super(context);
        //initialiseView(context, null);
    }

    public CalmnessStressCircularChartView(Context context, float stress, boolean display, float stressUpper, float stressLower) {
        super(context);
        this.stress = stress;
        this.display = display;
        this.stressUpper = stressUpper;
        this.stressLower = stressLower;
        //initialiseView(context, null);
    }

    public CalmnessStressCircularChartView(Context context, AttributeSet attrs) {
        super(context, attrs);
        //initialiseView(context, attrs);
    }

    private void initialiseView(Context context, AttributeSet attrs) {
        if (attrs != null) {
            TypedArray a = context.getTheme().obtainStyledAttributes(attrs, R.styleable.BatteryView, 0, 0);
            try {
                stress = a.getFloat(R.styleable.CalmnessStressCircularChartView_stress, stress);
            } finally {
                a.recycle();
            }
        }
        Log.d("CircularChart", "initializeView curr stress val="+this.stress);
        setLayerType(LAYER_TYPE_SOFTWARE, null);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        setBounds();
        setPaints();
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        measuredWidth = View.MeasureSpec.getSize(widthMeasureSpec);
        desiredHeight = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 300, getContext().getResources().getDisplayMetrics());
        super.onMeasure(MeasureSpec.makeMeasureSpec(measuredWidth, MeasureSpec.AT_MOST), MeasureSpec.makeMeasureSpec(desiredHeight, MeasureSpec.EXACTLY));
        setMeasuredDimension(measuredWidth, desiredHeight);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        String leftPercent = floatToPercent(1 - this.stress);
        String rightPercent = floatToPercent(this.stress);
        Log.d("CircularChart", "onDraw----------stress="+this.stress+" left="+leftPercent+ " right="+rightPercent);

        canvas.drawArc(graphBounds, -90, -(360 - stress * 285 - 40), false, calmnessPaint);
        canvas.drawArc(graphBounds, -90, (40 + stress * 285), false, stressPaint);

        drawCircularText(canvas, calmnessPercentBounds, leftPercent + "%", percentTextPaint, calmnessPercentBgPaint);
        drawCircularText(canvas, stressPercentBounds, rightPercent + "%", percentTextPaint, stressPercentBgPaint);

        drawLabelLeft(canvas, calmnessLabelBounds, "Calmness", calmnessLabelPaint);
//        drawLabelLeft(canvas, calmnessValueBounds, getStressToValue(1 - stress), calmnessValuePaint);
        drawLabelRight(canvas, stressLabelBounds, "Stress", stressLabelPaint);
        if (display) drawLabelRight(canvas, stressValueBounds, getStressToValue(stress), stressValuePaint);
    }

    private void setBounds() {
        graphBounds.set((measuredWidth - graphWidth) / 2, graphStrokeWidth, (measuredWidth + graphWidth) / 2, graphWidth + graphStrokeWidth);
        calmnessPercentBounds.set(graphBounds.left- percentageTextOffset, graphBounds.centerY() - percentageTextWidth / 2, graphBounds.left - percentageTextOffset + percentageTextWidth, graphBounds.centerY() + percentageTextWidth / 2);
        stressPercentBounds.set(graphBounds.right + percentageTextOffset - percentageTextWidth, graphBounds.centerY() - percentageTextWidth / 2, graphBounds.right + percentageTextOffset, graphBounds.centerY() + percentageTextWidth / 2);
        calmnessLabelBounds.set(labelMargin, 0, labelWidth + labelMargin, labelHeight);
        calmnessValueBounds.set(labelMargin, calmnessLabelBounds.bottom, labelWidth + labelMargin, calmnessLabelBounds.bottom + labelHeight);
        stressLabelBounds.set(measuredWidth - labelWidth - labelMargin, 0, measuredWidth - labelMargin, labelHeight);
        stressValueBounds.set(measuredWidth - labelWidth - labelMargin, stressLabelBounds.bottom, measuredWidth - labelMargin, stressLabelBounds.bottom + labelHeight);
    }

    private void setPaints() {
        int[] calmnessColors = {calmnessStartColor, calmnessEndColor};
        float[] calmnessColorPositions = {stress, 1f};
        Shader calmnessGradient = new SweepGradient(graphBounds.centerX(), graphBounds.centerY(), calmnessColors, calmnessColorPositions);
        Matrix calmnessMatrix = new Matrix();
        calmnessMatrix.setRotate(-72, graphBounds.centerX(), graphBounds.centerY());
        calmnessGradient.setLocalMatrix(calmnessMatrix);
        calmnessPaint.setStyle(Paint.Style.STROKE);
        calmnessPaint.setStrokeWidth(graphStrokeWidth);
        calmnessPaint.setStrokeCap(Paint.Cap.ROUND);
        calmnessPaint.setAntiAlias(true);
        calmnessPaint.setShader(calmnessGradient);
        calmnessPaint.setShadowLayer(shadowBlur, 0, 0, shadowColor);

        int[] stressColors = {stressStartColor, stressEndColor};
        float[] stressColorPositions = {0f, stress};
        Shader stressGradient = new SweepGradient(graphBounds.centerX(), graphBounds.centerY(), stressColors, stressColorPositions);
        Matrix stressMatrix = new Matrix();
        stressMatrix.setRotate(-108, graphBounds.centerX(), graphBounds.centerY());
        stressGradient.setLocalMatrix(stressMatrix);
        stressPaint.setStyle(Paint.Style.STROKE);
        stressPaint.setStrokeWidth(graphStrokeWidth);
        stressPaint.setStrokeCap(Paint.Cap.ROUND);
        stressPaint.setAntiAlias(true);
        stressPaint.setShader(stressGradient);
        stressPaint.setShadowLayer(shadowBlur, 0, 0, shadowColor);

        percentTextPaint.setTextSize(percentageTextSize);
        percentTextPaint.setTypeface(percentTextFont);
        percentTextPaint.setColor(percentTextColor);
        percentTextPaint.setTextAlign(Paint.Align.CENTER);

        calmnessPercentBgPaint.setColor(calmnessPercentBgColor);
        calmnessPercentBgPaint.setAntiAlias(true);

        stressPercentBgPaint.setColor(stressPercentBgColor);
        stressPercentBgPaint.setAntiAlias(true);

        calmnessLabelPaint.setColor(calmnessLabelColor);
        calmnessLabelPaint.setTextSize(labelTextSize);
        calmnessLabelPaint.setTypeface(labelTextFont);
        calmnessLabelPaint.setTextAlign(Paint.Align.LEFT);

        calmnessValuePaint.setColor(calmnessLabelColor);
        calmnessValuePaint.setTextSize(labelTextSize);
        calmnessValuePaint.setTypeface(labelValueFont);
        calmnessValuePaint.setTextAlign(Paint.Align.LEFT);

        stressLabelPaint.setColor(stressLabelColor);
        stressLabelPaint.setTextSize(labelTextSize);
        stressLabelPaint.setTypeface(labelTextFont);
        stressLabelPaint.setTextAlign(Paint.Align.RIGHT);

        stressValuePaint.setColor(stressLabelColor);
        stressValuePaint.setTextSize(labelTextSize);
        stressValuePaint.setTypeface(labelValueFont);
        stressValuePaint.setTextAlign(Paint.Align.RIGHT);
    }

    private void drawCircularText(Canvas canvas, RectF bounds, String text, Paint textPaint, Paint bgPaint) {
        canvas.drawCircle(bounds.centerX(), bounds.centerY(), bounds.width() / 2, bgPaint);
        canvas.drawText(text, bounds.centerX(), (int) (bounds.centerY() - (textPaint.descent() + textPaint.ascent()) / 2), textPaint);
    }

    private void drawLabelLeft(Canvas canvas, RectF bounds, String text, Paint textPaint) {
        canvas.drawText(text, bounds.left, (int) (bounds.centerY() - (textPaint.descent() + textPaint.ascent()) / 2), textPaint);
    }

    private void drawLabelRight(Canvas canvas, RectF bounds, String text, Paint textPaint) {
        canvas.drawText(text, bounds.right, (int) (bounds.centerY() - (textPaint.descent() + textPaint.ascent()) / 2), textPaint);
    }

    public void setStress(float stressPercent, boolean display, float stressUpper, float stressLower) {
        // TODO: 15/4/19 to replace the below logic
        this.stress = stressPercent == 0 ? 0.5f : stressPercent / 100f;
        this.display = display;
        this.stressUpper = stressUpper;
        this.stressLower = stressLower;
        Log.d("CircularChart", "setStress----------"+this.stress+"upper"+this.stressUpper+"lower="+this.stressLower);
        setPaints();
        invalidate();
        requestLayout();
    }

    public float getStressPercent() {
        return this.stress * 100;
    }

    private String floatToPercent(float value) {
        return new DecimalFormat("##0").format(value * 100);
    }

    private String getStressToValue(float stress) {
        if (stress < stressLower) {
            return "Low";
        } else if (stress <= stressUpper) {
            return "Moderate";
        } else {
            return "High";
        }
    }
}
